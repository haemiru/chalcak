import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCompletionEmail } from "@/lib/resend";
import { sendPushNotification, type PushSubscriptionData } from "@/lib/push";
import { DB } from "@/lib/constants";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface NotifyBody {
  userId: string;
  tuneId: number;
  style: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, tuneId, style }: NotifyBody = await request.json();
    if (!userId || !tuneId || !style) {
      return NextResponse.json(
        { error: "userId, tuneId, style are required" },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const resultUrl = `${baseUrl}/result?tuneId=${tuneId}`;

    // 1. Send email notification — Auth에서 직접 이메일 가져오기 (chalcak_users 미등록 케이스 대응)
    let email: string | null = null;

    const { data: userRow } = await db
      .from(DB.users)
      .select("email")
      .eq("id", userId)
      .single();

    if (userRow?.email) {
      email = userRow.email;
    } else {
      // chalcak_users에 없으면 Supabase Auth에서 직접 조회
      const { data: authUser } = await db.auth.admin.getUserById(userId);
      email = authUser?.user?.email ?? null;
    }

    if (email) {
      try {
        await sendCompletionEmail({
          to: email,
          style,
          resultUrl,
        });
      } catch (err) {
        console.error("Email notification failed:", err);
      }
    }

    // 2. Send push notification (if subscribed)
    const { data: pushSubs } = await db
      .from(DB.pushSubscriptions)
      .select("subscription")
      .eq("user_id", userId);

    if (pushSubs && pushSubs.length > 0) {
      const payload = {
        title: "찰칵AI — 사진 완성!",
        body: "지금 확인하세요",
        url: resultUrl,
      };

      await Promise.allSettled(
        pushSubs.map((row) =>
          sendPushNotification(
            row.subscription as PushSubscriptionData,
            payload
          )
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notify error:", error);
    return NextResponse.json(
      { error: "Notification failed" },
      { status: 500 }
    );
  }
}
