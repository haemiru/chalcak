import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

// App Router body size limit (default 4.5MB → 50MB)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

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

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("photos") as File[];

    if (files.length < 1 || files.length > 15) {
      return NextResponse.json(
        { error: "사진은 1~15장 사이여야 합니다." },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();
    const bucket = "training-photos";
    const folder = `${userId}/${Date.now()}`;
    const imageUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder}/${i}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await db.storage
        .from(bucket)
        .upload(path, buffer, { contentType: file.type });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = db.storage.from(bucket).getPublicUrl(path);
      imageUrls.push(urlData.publicUrl);
    }

    return NextResponse.json({ imageUrls, folder });
  } catch (error) {
    console.error("Upload photos error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
