import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateImages, STYLE_PROMPTS } from "@/lib/astria";
import { DB } from "@/lib/constants";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Astria 콜백 웹훅
 *
 * 1) Tune(학습) 완료 시 → 이미지 생성 요청
 * 2) Prompt(생성) 완료 시 → DB에 이미지 URL 저장 + 알림
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getSupabaseAdmin();
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const appUrl =
      rawAppUrl.startsWith("http://localhost") || !rawAppUrl
        ? process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : rawAppUrl || "http://localhost:3000"
        : rawAppUrl;

    // Astria sends tune callback when training completes
    if (body.tune) {
      const tune = body.tune;
      const tuneId: number = tune.id;
      const tuneStatus: string = tune.status; // "completed" or "failed"

      if (tuneStatus !== "completed") {
        console.error(`Tune ${tuneId} failed:`, tune);
        return NextResponse.json({ received: true, action: "tune_failed" });
      }

      // 학습 완료 → 해당 generation의 style을 찾아 이미지 생성 요청
      const { data: gen } = await db
        .from(DB.generations)
        .select("style, user_id")
        .eq("tune_id", tuneId)
        .single();

      if (!gen) {
        console.error(`No generation found for tune ${tuneId}`);
        return NextResponse.json({ error: "Generation not found" }, { status: 404 });
      }

      const styleConfig = STYLE_PROMPTS[gen.style] ?? STYLE_PROMPTS["kakao"];

      const prompt = await generateImages({
        tuneId,
        prompt: styleConfig.prompt,
        negativePrompt: styleConfig.negative,
        numImages: styleConfig.numImages,
        callbackUrl: `${appUrl}/api/webhook/astria`,
      });

      console.log(`Tune ${tuneId} completed, prompt ${prompt.id} started`);
      return NextResponse.json({ received: true, action: "generation_started", promptId: prompt.id });
    }

    // Astria sends prompt callback when image generation completes
    if (body.prompt) {
      const prompt = body.prompt;
      const tuneId: number = prompt.tune_id;
      const images: string[] = prompt.images ?? [];

      if (!images.length) {
        console.error(`Prompt for tune ${tuneId} produced no images`);
        return NextResponse.json({ received: true, action: "no_images" });
      }

      // DB에 생성된 이미지 URL 저장
      const { error: updateError } = await db
        .from(DB.generations)
        .update({ image_urls: images })
        .eq("tune_id", tuneId);

      if (updateError) {
        console.error("Failed to update generation:", updateError);
      }

      // 크레딧 차감
      const { data: gen } = await db
        .from(DB.generations)
        .select("user_id, style")
        .eq("tune_id", tuneId)
        .single();

      if (gen) {
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
      }

      // 알림 전송 (이메일 + 푸시)

      if (gen) {
        try {
          await fetch(`${appUrl}/api/generate/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: gen.user_id,
              tuneId,
              style: gen.style,
            }),
          });
        } catch (err) {
          console.error("Notify failed:", err);
        }
      }

      // 원본 사진 삭제 (Supabase Storage) — 생성 완료 후 즉시
      if (gen) {
        try {
          const { data: files } = await db.storage
            .from("training-photos")
            .list(gen.user_id);

          if (files && files.length > 0) {
            // 유저 폴더 하위의 모든 파일 삭제
            const paths = files.map((f) => `${gen.user_id}/${f.name}`);
            await db.storage.from("training-photos").remove(paths);
          }
        } catch (err) {
          console.error("Failed to cleanup training photos:", err);
        }
      }

      console.log(`Tune ${tuneId}: ${images.length} images saved`);
      return NextResponse.json({ received: true, action: "images_saved", count: images.length });
    }

    return NextResponse.json({ received: true, action: "unknown_event" });
  } catch (error) {
    console.error("Astria webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
