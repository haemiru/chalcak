import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLANS, DB, type PlanKey } from "@/lib/constants";
import { chargeBilling } from "@/lib/toss";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — fetch user's subscription
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from(DB.subscriptions)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription: data });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT — change plan
export async function PUT(request: NextRequest) {
  try {
    const { userId, newPlan } = (await request.json()) as {
      userId: string;
      newPlan: PlanKey;
    };

    if (!userId || !newPlan || !(newPlan in PLANS)) {
      return NextResponse.json(
        { error: "유효하지 않은 요청입니다." },
        { status: 400 }
      );
    }

    const plan = PLANS[newPlan];
    if (plan.type !== "subscription") {
      return NextResponse.json(
        { error: "구독 플랜만 변경 가능합니다." },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();

    // Get current subscription
    const { data: current } = await db
      .from(DB.subscriptions)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!current || !current.billing_key) {
      return NextResponse.json(
        { error: "활성 구독이 없습니다." },
        { status: 404 }
      );
    }

    // Charge with new plan price
    const orderId = `change_${Date.now()}_${newPlan}`;
    await chargeBilling({
      billingKey: current.billing_key,
      customerKey: userId,
      amount: plan.price,
      orderId,
      orderName: `찰칵AI ${plan.label} 구독 변경`,
    });

    // Update subscription
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    await db
      .from(DB.subscriptions)
      .update({
        plan: newPlan,
        monthly_credits: plan.credits,
        used_credits: 0,
        next_billing_date: nextBilling.toISOString(),
      })
      .eq("user_id", userId);

    // Save payment record
    await db.from(DB.payments).insert({
      user_id: userId,
      amount: plan.price,
      plan_type: newPlan,
      status: "paid",
      order_id: orderId,
    });

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error) {
    console.error("Change plan error:", error);
    const message =
      error instanceof Error ? error.message : "플랜 변경에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = (await request.json()) as { userId: string };
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();

    // Mark subscription as cancelled (keep until billing period ends)
    const { error } = await db
      .from(DB.subscriptions)
      .update({
        status: "cancelled",
      })
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      return NextResponse.json(
        { error: "구독 해지에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
