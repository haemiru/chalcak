"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AdminStats {
  mrr: number;
  monthlyRevenue: number;
  totalSubscribers: number;
  totalUsers: number;
  pwaInstalls: number;
  planDistribution: Record<string, number>;
  waitingByStyle: Record<string, number>;
}

const PLAN_LABELS: Record<string, string> = {
  trial: "체험",
  basic: "베이직",
  pro: "프로",
  premium: "프리미엄",
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  async function fetchStats(key: string) {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-key": key },
      });
      if (!res.ok) {
        setError("인증에 실패했습니다.");
        return;
      }
      const data = await res.json();
      setStats(data);
      setAuthenticated(true);
    } catch {
      setError("데이터를 불러오지 못했습니다.");
    }
  }

  // Auto-load if key is in sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("adminKey");
    if (saved) fetchStats(saved);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("adminKey", adminKey);
    fetchStats(adminKey);
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <form onSubmit={handleLogin} className="w-full max-w-xs">
          <h1 className="text-center text-xl font-bold">관리자 로그인</h1>
          <input
            type="password"
            placeholder="관리자 키 입력"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="mt-4 h-12 w-full rounded-xl border border-gray-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white"
          >
            접속
          </button>
        </form>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        로딩 중...
      </div>
    );
  }

  // Sort waiting list by count descending (dev priority)
  const waitingEntries = Object.entries(stats.waitingByStyle).sort(
    (a, b) => b[1] - a[1]
  );

  const pwaRate =
    stats.totalUsers > 0
      ? Math.round((stats.pwaInstalls / stats.totalUsers) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 px-5 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-lg font-extrabold text-primary">
            찰칵AI Admin
          </h1>
          <Link href="/" className="text-sm text-gray-400">
            사이트로
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 pt-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="MRR"
            value={`${(stats.mrr / 10000).toFixed(1)}만원`}
          />
          <StatCard
            label="이번 달 매출"
            value={`${(stats.monthlyRevenue / 10000).toFixed(1)}만원`}
          />
          <StatCard
            label="활성 구독자"
            value={`${stats.totalSubscribers}명`}
          />
          <StatCard
            label="PWA 설치율"
            value={`${pwaRate}%`}
            sub={`${stats.pwaInstalls} / ${stats.totalUsers}명`}
          />
        </div>

        {/* Plan distribution */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700">플랜별 분포</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(stats.planDistribution).map(([plan, count]) => {
              const total = stats.totalSubscribers || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {PLAN_LABELS[plan] ?? plan}
                    </span>
                    <span className="font-medium">
                      {count}명 ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.planDistribution).length === 0 && (
              <p className="text-sm text-gray-400">아직 구독자가 없습니다</p>
            )}
          </div>
        </div>

        {/* Coming Soon waiting — dev priority */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700">
            Coming Soon 알림 신청 (개발 우선순위)
          </h2>
          <div className="mt-3 space-y-2">
            {waitingEntries.length === 0 ? (
              <p className="text-sm text-gray-400">신청 내역 없음</p>
            ) : (
              waitingEntries.map(([style, count], i) => (
                <div
                  key={style}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{style}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {count}명
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}
