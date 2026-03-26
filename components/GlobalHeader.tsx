"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function GlobalHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
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
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition hover:bg-gray-50"
            >
              <span className="max-w-[120px] truncate font-medium">
                {displayName}
              </span>
              {providerLabel && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {providerLabel}
                </span>
              )}
              <span className="text-gray-300">▾</span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  <p className="px-3 py-2 text-xs text-gray-400 truncate">
                    {user.email}
                  </p>
                  <hr className="border-gray-100" />
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    내 사진첩
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-50"
                  >
                    로그아웃
                  </button>
                </div>
              </>
            )}
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
