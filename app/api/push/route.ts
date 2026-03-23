import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DB } from "@/lib/constants";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Save push subscription
export async function POST(request: NextRequest) {
  try {
    const { userId, subscription } = await request.json();
    if (!userId || !subscription) {
      return NextResponse.json(
        { error: "userId and subscription are required" },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();
    const { error } = await db.from(DB.pushSubscriptions).upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        subscription,
      },
      { onConflict: "endpoint" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}

// Remove push subscription
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json(
        { error: "endpoint is required" },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();
    await db.from(DB.pushSubscriptions).delete().eq("endpoint", endpoint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
