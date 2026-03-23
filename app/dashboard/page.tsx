"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { signOut } from "@/lib/auth";
import { PLANS, ACTIVE_STYLES, DB, type PlanKey } from "@/lib/constants";
import type { User } from "@supabase/supabase-js";

interface Subscription {
  plan: PlanKey;
  status: string;
  monthly_credits: number;
  used_credits: number;
  next_billing_date: string;
}

interface Generation {
  id: string;
  tune_id: number;
  style: string;
  image_urls: string[];
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowser();

      // Check auth
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push("/login");
        return;
      }
      setUser(authData.user);
      const userId = authData.user.id;

      // Fetch subscription & generations in parallel
      const [subRes, genRes] = await Promise.all([
        supabase
          .from(DB.subscriptions)
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .single(),
        supabase
          .from(DB.generations)
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (subRes.data) setSubscription(subRes.data);
      if (genRes.data) setGenerations(genRes.data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        로딩 중...
      </div>
    );
  }

  const plan = subscription ? PLANS[subscription.plan] : null;
  const creditPercent = subscription
    ? Math.round(
        ((subscription.monthly_credits - subscription.used_credits) /
          subscription.monthly_credits) *
          100
      )
    : 0;
  const remaining = subscription
    ? subscription.monthly_credits - subscription.used_credits
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 px-5 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/" className="text-lg font-extrabold text-primary">
            찰칵AI
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 pt-6">
        {/* User greeting */}
        <p className="text-sm text-gray-500">
          안녕하세요,{" "}
          <span className="font-medium text-gray-900">
            {user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "회원"}
          </span>
          님
        </p>

        {/* Current plan card */}
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">현재 플랜</p>
              <p className="mt-0.5 text-lg font-bold">
                {plan ? plan.label : "플랜 없음"}
              </p>
            </div>
            {subscription && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                활성
              </span>
            )}
          </div>

          {subscription && (
            <>
              {/* Credit progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">남은 크레딧</span>
                  <span className="font-bold">
                    <span className="text-primary">{remaining}</span>/
                    {subscription.monthly_credits}장
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${creditPercent}%` }}
                  />
                </div>
              </div>

              {/* Next billing */}
              <p className="mt-3 text-xs text-gray-400">
                다음 결제일:{" "}
                {new Date(subscription.next_billing_date).toLocaleDateString(
                  "ko-KR"
                )}
              </p>
            </>
          )}

          {/* Upgrade button */}
          <Link
            href="/payment?style=all"
            className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary transition active:scale-[0.97]"
          >
            {subscription ? "플랜 업그레이드" : "플랜 시작하기"}
          </Link>
        </div>

        {/* Subscription management */}
        {subscription && (
          <div className="mt-3 flex gap-2">
            <Link
              href="/payment?style=all"
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600"
            >
              플랜 변경
            </Link>
            <button
              onClick={async () => {
                if (!confirm("정말 구독을 해지하시겠어요?")) return;
                await fetch("/api/subscription", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: user?.id }),
                });
                router.refresh();
              }}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-medium text-red-500"
            >
              구독 해지
            </button>
          </div>
        )}

        {/* New generation CTA */}
        <Link
          href="/upload"
          className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 transition active:scale-[0.97]"
        >
          📷 새 사진 생성하기
        </Link>

        {/* Generation history */}
        <div className="mt-8">
          <h2 className="text-sm font-bold text-gray-700">생성 히스토리</h2>

          {generations.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-8 text-center">
              <span className="text-3xl">📸</span>
              <p className="mt-2 text-sm text-gray-500">
                아직 생성한 사진이 없어요
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {generations.map((gen) => {
                const style = ACTIVE_STYLES.find((s) => s.id === gen.style);
                const hasImages =
                  Array.isArray(gen.image_urls) && gen.image_urls.length > 0;
                return (
                  <div
                    key={gen.id}
                    className="rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {style?.emoji ?? "📷"}
                        </span>
                        <div>
                          <p className="text-sm font-bold">
                            {style?.name ?? gen.style}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(gen.created_at).toLocaleDateString(
                              "ko-KR"
                            )}
                          </p>
                        </div>
                      </div>
                      {hasImages ? (
                        <Link
                          href={`/result?tuneId=${gen.tune_id}&style=${gen.style}`}
                          className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"
                        >
                          보기
                        </Link>
                      ) : (
                        <span className="rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-medium text-yellow-700">
                          생성 중
                        </span>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    {hasImages && (
                      <div className="mt-3 flex gap-1.5 overflow-x-auto">
                        {gen.image_urls.slice(0, 4).map((url, i) => (
                          <div
                            key={i}
                            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100"
                          >
                            <Image
                              src={url}
                              alt={`${style?.name} ${i + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ))}
                        {gen.image_urls.length > 4 && (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-medium text-gray-400">
                            +{gen.image_urls.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
