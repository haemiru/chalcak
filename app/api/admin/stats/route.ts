import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DB } from "@/lib/constants";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    // Simple admin check via header (replace with proper auth in production)
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getSupabaseAdmin();

    // Run all queries in parallel
    const [
      subsRes,
      paymentsRes,
      waitingRes,
      pushRes,
      totalUsersRes,
    ] = await Promise.all([
      // Active subscriptions by plan
      db.from(DB.subscriptions).select("plan, status").eq("status", "active"),
      // Total paid amount (this month)
      db
        .from(DB.payments)
        .select("amount, plan_type, created_at")
        .eq("status", "paid")
        .gte(
          "created_at",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        ),
      // Waiting list counts by style
      db.from(DB.waitingList).select("style_name"),
      // Push subscriptions count
      db.from(DB.pushSubscriptions).select("id", { count: "exact", head: true }),
      // Total users
      db.from(DB.users).select("id", { count: "exact", head: true }),
    ]);

    // Calculate MRR
    const activeSubscriptions = subsRes.data ?? [];
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      const planPrices: Record<string, number> = {
        basic: 4900,
        pro: 9900,
        premium: 29000,
      };
      return sum + (planPrices[sub.plan] ?? 0);
    }, 0);

    // Plan distribution
    const planDistribution: Record<string, number> = {};
    activeSubscriptions.forEach((sub) => {
      planDistribution[sub.plan] = (planDistribution[sub.plan] ?? 0) + 1;
    });

    // Waiting list by style
    const waitingByStyle: Record<string, number> = {};
    (waitingRes.data ?? []).forEach((row) => {
      waitingByStyle[row.style_name] =
        (waitingByStyle[row.style_name] ?? 0) + 1;
    });

    // Revenue this month
    const monthlyRevenue = (paymentsRes.data ?? []).reduce(
      (sum, p) => sum + p.amount,
      0
    );

    return NextResponse.json({
      mrr,
      monthlyRevenue,
      totalSubscribers: activeSubscriptions.length,
      totalUsers: totalUsersRes.count ?? 0,
      pwaInstalls: pushRes.count ?? 0,
      planDistribution,
      waitingByStyle,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
