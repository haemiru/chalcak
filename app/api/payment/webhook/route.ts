import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { DB } from "@/lib/constants";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  if (!secret) {
    console.error("TOSS_WEBHOOK_SECRET is not configured");
    return false;
  }
  const expected = createHmac("sha256", secret).update(body).digest("base64");
  return expected === signature;
}

interface WebhookEvent {
  eventType: string;
  data: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    billingKey?: string;
    customerKey?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature
    const signature = request.headers.get("toss-signature") ?? "";
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event: WebhookEvent = JSON.parse(rawBody);
    const db = getSupabaseAdmin();

    switch (event.eventType) {
      case "PAYMENT_STATUS_CHANGED": {
        const { paymentKey, status } = event.data;
        if (!paymentKey || !status) break;

        // Update payment status
        await db
          .from(DB.payments)
          .update({ status: status.toLowerCase() })
          .eq("payment_key", paymentKey);

        // If cancelled, update subscription if applicable
        if (status === "CANCELED" || status === "EXPIRED") {
          const { data: payment } = await db
            .from(DB.payments)
            .select("user_id")
            .eq("payment_key", paymentKey)
            .single();

          if (payment) {
            await db
              .from(DB.subscriptions)
              .update({ status: "cancelled" })
              .eq("user_id", payment.user_id);
          }
        }
        break;
      }

      case "BILLING_KEY_STATUS_CHANGED": {
        const { billingKey, customerKey, status } = event.data;
        if (!billingKey || !customerKey) break;

        if (status === "EXPIRED" || status === "STOPPED") {
          await db
            .from(DB.subscriptions)
            .update({ status: "cancelled", billing_key: null })
            .eq("user_id", customerKey)
            .eq("billing_key", billingKey);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
