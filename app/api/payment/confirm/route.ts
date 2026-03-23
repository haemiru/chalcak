import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { PLANS, DB, type PlanKey } from "@/lib/constants";
import { confirmPayment, issueBillingKey, chargeBilling } from "@/lib/toss";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** 쿠키에서 현재 로그인 유저 ID를 가져온다 */
async function getUserId(request: NextRequest): Promise<string | null> {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const planKey = searchParams.get("plan") as PlanKey | null;
  const style = searchParams.get("style") ?? "";
  const isBilling = searchParams.get("type") === "billing";
  const baseUrl = new URL("/", request.url).origin;

  // Validate plan
  if (!planKey || !(planKey in PLANS)) {
    return NextResponse.redirect(
      `${baseUrl}/payment?style=${style}&error=invalid_plan`
    );
  }

  // 로그인 유저 확인
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const plan = PLANS[planKey];
  const db = getSupabaseAdmin();

  try {
    if (isBilling) {
      // ── Subscription: billing key flow ──
      const authKey = searchParams.get("authKey");
      const customerKey = searchParams.get("customerKey");

      if (!authKey || !customerKey) {
        return NextResponse.redirect(
          `${baseUrl}/payment?style=${style}&error=missing_params`
        );
      }

      // 1. Issue billing key
      const billing = await issueBillingKey({ authKey, customerKey });

      // 2. Charge first month
      const orderId = `sub_${Date.now()}_${planKey}`;
      const payment = await chargeBilling({
        billingKey: billing.billingKey,
        customerKey,
        amount: plan.price,
        orderId,
        orderName: `찰칵AI ${plan.label} 구독`,
      });

      // 3. Verify amount matches plan
      if (payment.totalAmount !== plan.price) {
        return NextResponse.redirect(
          `${baseUrl}/payment?style=${style}&error=amount_mismatch`
        );
      }

      // 4. Save payment record
      await db.from(DB.payments).insert({
        user_id: userId,
        amount: payment.totalAmount,
        plan_type: planKey,
        status: "paid",
        payment_key: payment.paymentKey,
        order_id: payment.orderId,
      });

      // 5. Create/update subscription
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      await db.from(DB.subscriptions).upsert(
        {
          user_id: userId,
          plan: planKey,
          status: "active",
          billing_key: billing.billingKey,
          next_billing_date: nextBilling.toISOString(),
          monthly_credits: plan.credits,
          used_credits: 0,
        },
        { onConflict: "user_id" }
      );
    } else {
      // ── One-time payment flow ──
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");

      if (!paymentKey || !orderId || !amount) {
        return NextResponse.redirect(
          `${baseUrl}/payment?style=${style}&error=missing_params`
        );
      }

      // Server-side amount verification — never trust client amount
      if (Number(amount) !== plan.price) {
        return NextResponse.redirect(
          `${baseUrl}/payment?style=${style}&error=amount_mismatch`
        );
      }

      // Confirm with Toss
      const payment = await confirmPayment({
        paymentKey,
        orderId,
        amount: plan.price,
      });

      // Save payment record
      await db.from(DB.payments).insert({
        user_id: userId,
        amount: payment.totalAmount,
        plan_type: planKey,
        status: "paid",
        payment_key: payment.paymentKey,
        order_id: payment.orderId,
      });
    }

    // Redirect to generate page
    return NextResponse.redirect(
      `${baseUrl}/generate?style=${style}&plan=${planKey}`
    );
  } catch (error) {
    console.error("Payment confirm error:", error);
    const message =
      error instanceof Error ? error.message : "payment_error";
    return NextResponse.redirect(
      `${baseUrl}/payment?style=${style}&error=${encodeURIComponent(message)}`
    );
  }
}
