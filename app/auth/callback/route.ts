import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { DB } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 카카오 로그인 시 provider_token(카카오 액세스 토큰) 저장
  const session = data?.session;
  if (session?.provider_token && session.user) {
    const provider = session.user.app_metadata?.provider;
    if (provider === "kakao") {
      const db = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error: upsertError } = await db.from(DB.users).upsert(
        {
          id: session.user.id,
          email: session.user.email,
          kakao_access_token: session.provider_token,
          kakao_refresh_token: session.provider_refresh_token ?? null,
        },
        { onConflict: "id" }
      );
      if (upsertError) {
        console.error("Failed to save Kakao tokens:", upsertError);
      }
    }
  }

  return response;
}
