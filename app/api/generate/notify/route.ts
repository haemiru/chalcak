import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCompletionEmail } from "@/lib/resend";
import { sendPushNotification, type PushSubscriptionData } from "@/lib/push";
import { sendKakaoMessage } from "@/lib/kakao-message";
import { DB } from "@/lib/constants";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface NotifyBody {
  userId: string;
  tuneId: string;
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

    // 1. 유저 정보 조회 (이메일 + 카카오 토큰)
    const { data: userRow } = await db
      .from(DB.users)
      .select("email, kakao_access_token")
      .eq("id", userId)
      .single();

    let email: string | null = userRow?.email ?? null;
    if (!email) {
      const { data: authUser } = await db.auth.admin.getUserById(userId);
      email = authUser?.user?.email ?? null;
    }

    // 1-a. 카카오톡 나에게 보내기
    if (userRow?.kakao_access_token) {
      try {
        await sendKakaoMessage({
          accessToken: userRow.kakao_access_token,
          style,
          resultUrl,
        });
        console.log(`Kakao message sent to user ${userId}`);
      } catch (err) {
        console.error("Kakao message failed:", err);
      }
    }

    // 1-b. 이메일 알림
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
