import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { createTune } from "@/lib/astria";
import { DB } from "@/lib/constants";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

interface CreateModelBody {
  imageUrls: string[];
  style: string;
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CreateModelBody = await request.json();
    const { imageUrls, style } = body;

    if (!imageUrls?.length || !style) {
      return NextResponse.json(
        { error: "imageUrls, style은 필수입니다." },
        { status: 400 }
      );
    }

    if (imageUrls.length < 8 || imageUrls.length > 15) {
      return NextResponse.json(
        { error: "사진은 8~15장 사이여야 합니다." },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();

    // Check payment — MUST verify before model training
    const { data: payment, error: paymentError } = await db
      .from(DB.payments)
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "결제가 확인되지 않았습니다." },
        { status: 402 }
      );
    }

    // Call Astria API — callback must be publicly reachable
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.startsWith("http://localhost")
        ? process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXT_PUBLIC_APP_URL
        : process.env.NEXT_PUBLIC_APP_URL;
    const callbackUrl = `${appUrl}/api/webhook/astria`;
    const tune = await createTune({
      title: `${userId}-${style}-${Date.now()}`,
      imageUrls,
      className: "person",
      callbackUrl,
    });

    // Save to generations table
    await db.from(DB.generations).insert({
      user_id: userId,
      tune_id: tune.id,
      style,
      image_urls: [],
    });

    return NextResponse.json(
      { tuneId: tune.id, status: "processing" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create model error:", error);
    const message =
      error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
