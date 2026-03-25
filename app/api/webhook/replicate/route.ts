import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPrediction, STYLE_PROMPTS } from "@/lib/replicate";
import { DB } from "@/lib/constants";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getAppUrl(): string {
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (rawAppUrl.startsWith("http://localhost") || !rawAppUrl) {
    return process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : rawAppUrl || "http://localhost:3000";
  }
  return rawAppUrl;
}

/**
 * Replicate webhook handler
 *
 * Replicate sends the full training/prediction object as the POST body.
 * We distinguish between training and prediction by checking body fields:
 * - Training completed: body.output.version exists → create prediction
 * - Prediction completed: body.output is an array of image URLs → save to DB
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getSupabaseAdmin();
    const appUrl = getAppUrl();
    const webhookUrl = `${appUrl}/api/webhook/replicate`;

    const status: string = body.status;
    const id: string = body.id;

    // -- Training completed --
    // Training responses have output.version (the trained model version)
    if (body.output?.version || body.output?.weights) {
      const trainingId = id;

      if (status !== "succeeded") {
        console.error(`Training ${trainingId} failed:`, body.error);
        return NextResponse.json({
          received: true,
          action: "training_failed",
        });
      }

      // Extract the trained model version
      const trainedVersion: string | undefined = body.output?.version;

      if (!trainedVersion) {
        console.error(
          `Training ${trainingId} completed but no version in output:`,
          body.output
        );
        return NextResponse.json({
          received: true,
          action: "training_no_version",
        });
      }

      // Find the generation record by tune_id (stores training ID)
      const { data: gen } = await db
        .from(DB.generations)
        .select("style, user_id")
        .eq("tune_id", trainingId)
        .single();

      if (!gen) {
        console.error(`No generation found for training ${trainingId}`);
        return NextResponse.json(
          { error: "Generation not found" },
          { status: 404 }
        );
      }

      const styleConfig = STYLE_PROMPTS[gen.style] ?? STYLE_PROMPTS["kakao"];

      // Start image generation using the trained model version
      const prediction = await createPrediction({
        version: trainedVersion,
        prompt: styleConfig.prompt,
        numOutputs: styleConfig.numImages,
        webhookUrl,
      });

      // Store prediction ID so we can link it back to the generation
      // We append it to a metadata approach: store in tune_id as "trainingId|predictionId"
      // Actually, keep it simple: store prediction_id alongside tune_id
      // Since we don't have a prediction_id column, we'll look up by tune_id later
      // The prediction webhook will need to know which generation to update
      // Strategy: store prediction mapping in a temporary way
      // For now, save prediction_id in the generation record's image_urls as metadata
      await db
        .from(DB.generations)
        .update({
          image_urls: [],
          // Store the prediction ID temporarily by updating tune_id to include it
          // Better approach: use tune_id for training, and match via the version
        })
        .eq("tune_id", trainingId);

      // Store prediction→training mapping by saving trained version in generation
      // We'll use a convention: when prediction webhook fires, we look up by version
      // Simpler: update tune_id to prediction ID so the prediction webhook can find it
      // But we need training ID too. Let's keep tune_id as training ID and add
      // the prediction ID as a query param in the webhook URL.
      // Actually the cleanest approach: fire prediction with webhook URL containing tune_id
      // Replicate doesn't support custom webhook params, so let's just update the
      // generation record to also track the prediction.

      // Store prediction mapping: update generation to include prediction_id
      // We'll concatenate: "trainingId::predictionId"
      await db
        .from(DB.generations)
        .update({ tune_id: `${trainingId}::${prediction.id}` })
        .eq("tune_id", trainingId);

      console.log(
        `Training ${trainingId} completed, prediction ${prediction.id} started`
      );
      return NextResponse.json({
        received: true,
        action: "generation_started",
        predictionId: prediction.id,
      });
    }

    // -- Prediction completed --
    // Prediction responses have output as an array of URLs
    if (Array.isArray(body.output)) {
      const predictionId = id;
      const images: string[] = body.output ?? [];

      if (status !== "succeeded" || !images.length) {
        console.error(`Prediction ${predictionId} failed or no images:`, body.error);
        return NextResponse.json({
          received: true,
          action: "prediction_failed",
        });
      }

      // Find generation by prediction ID (stored as "trainingId::predictionId")
      // Use a LIKE query to match the prediction ID
      const { data: gen } = await db
        .from(DB.generations)
        .select("tune_id, user_id, style")
        .like("tune_id", `%::${predictionId}`)
        .single();

      if (!gen) {
        console.error(
          `No generation found for prediction ${predictionId}`
        );
        return NextResponse.json(
          { error: "Generation not found" },
          { status: 404 }
        );
      }

      // Extract original training ID and restore tune_id
      const trainingId = gen.tune_id.split("::")[0];

      // Save generated image URLs and restore tune_id to just the training ID
      const { error: updateError } = await db
        .from(DB.generations)
        .update({
          image_urls: images,
          tune_id: trainingId,
        })
        .eq("tune_id", gen.tune_id);

      if (updateError) {
        console.error("Failed to update generation:", updateError);
      }

      // Deduct credits
      const { data: sub } = await db
        .from(DB.subscriptions)
        .select("id, used_credits")
        .eq("user_id", gen.user_id)
        .eq("status", "active")
        .single();

      if (sub) {
        await db
          .from(DB.subscriptions)
          .update({ used_credits: sub.used_credits + images.length })
          .eq("id", sub.id);
      }

      // Send notifications (email + push)
      try {
        await fetch(`${appUrl}/api/generate/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: gen.user_id,
            tuneId: trainingId,
            style: gen.style,
          }),
        });
      } catch (err) {
        console.error("Notify failed:", err);
      }

      // Delete original photos from Supabase Storage
      try {
        const { data: files } = await db.storage
          .from("training-photos")
          .list(gen.user_id);

        if (files && files.length > 0) {
          const paths = files.map((f) => `${gen.user_id}/${f.name}`);
          await db.storage.from("training-photos").remove(paths);
        }
      } catch (err) {
        console.error("Failed to cleanup training photos:", err);
      }

      console.log(
        `Prediction ${predictionId}: ${images.length} images saved for training ${trainingId}`
      );
      return NextResponse.json({
        received: true,
        action: "images_saved",
        count: images.length,
      });
    }

    // Unknown event type
    console.log("Replicate webhook: unknown event", { id, status });
    return NextResponse.json({ received: true, action: "unknown_event" });
  } catch (error) {
    console.error("Replicate webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
