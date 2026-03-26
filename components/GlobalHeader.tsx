"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function GlobalHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayName =
    user?.user_metadata?.name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "";

  const provider = user?.app_metadata?.provider;
  const providerLabel =
    provider === "kakao"
      ? "카카오"
      : provider === "google"
        ? "Google"
        : provider === "email"
          ? "이메일"
          : "";

  async function handleLogout() {
    await createSupabaseBrowser().auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="text-base font-bold text-primary">
          찰칵AI
        </Link>

        {loading ? (
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
        ) : user ? (
          <div className="flex items-center gap-2.5">
            <span className="max-w-[80px] truncate text-sm font-medium text-gray-700">
              {displayName}
            </span>
            {providerLabel && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                {providerLabel}
              </span>
            )}
            <span className="text-gray-200">|</span>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-600 transition hover:text-primary"
            >
              사진첩
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 transition hover:text-red-500"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
