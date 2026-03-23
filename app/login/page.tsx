"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithKakao,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function handleKakao() {
    setLoading(true);
    setError("");
    try {
      await signInWithKakao();
    } catch {
      setError("카카오 로그인에 실패했어요.");
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        router.push("/dashboard");
      } else {
        await signUpWithEmail(email, password);
        setSignupDone(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "오류가 발생했어요. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  }

  if (signupDone) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <span className="text-4xl">📧</span>
          <h1 className="mt-4 text-xl font-bold">이메일을 확인해주세요</h1>
          <p className="mt-2 text-sm text-gray-500">
            <strong>{email}</strong>로 인증 링크를 보냈어요.
            <br />
            메일의 링크를 클릭하면 가입이 완료됩니다.
          </p>
          <button
            onClick={() => {
              setSignupDone(false);
              setMode("login");
            }}
            className="mt-6 text-sm font-medium text-primary"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="text-2xl font-extrabold text-primary">
            찰칵AI
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            {mode === "login" ? "로그인하고 시작하세요" : "새 계정 만들기"}
          </p>
        </div>

        {/* Kakao login */}
        <button
          onClick={handleKakao}
          disabled={loading}
          className="mt-8 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-base font-bold text-[#191919] transition active:scale-[0.97] disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 1C4.58 1 1 3.8 1 7.24c0 2.22 1.48 4.17 3.7 5.28-.16.6-.58 2.16-.67 2.5-.1.42.16.41.33.3.13-.09 2.1-1.43 2.95-2.01.55.08 1.12.12 1.69.12 4.42 0 8-2.8 8-6.19C17 3.8 13.42 1 9 1z"
              fill="#191919"
            />
          </svg>
          카카오로 시작하기
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            required
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
          >
            {loading
              ? "처리 중..."
              : mode === "login"
                ? "이메일로 로그인"
                : "회원가입"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="mt-6 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>
              계정이 없으신가요?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="font-medium text-primary"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="font-medium text-primary"
              >
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
