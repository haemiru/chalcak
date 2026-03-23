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
    const tuneId = request.nextUrl.searchParams.get("tuneId");
    if (!tuneId) {
      return NextResponse.json(
        { error: "tuneId is required" },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from(DB.generations)
      .select("tune_id, style, image_urls, created_at")
      .eq("tune_id", Number(tuneId))
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    const isComplete =
      Array.isArray(data.image_urls) && data.image_urls.length > 0;

    return NextResponse.json({
      tuneId: data.tune_id,
      style: data.style,
      status: isComplete ? "completed" : "processing",
      imageUrls: isComplete ? data.image_urls : [],
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
