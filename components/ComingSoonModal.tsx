"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { DB } from "@/lib/constants";

interface ComingSoonModalProps {
  styleName: string;
  onClose: () => void;
}

export default function ComingSoonModal({
  styleName,
  onClose,
}: ComingSoonModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const { error } = await getSupabase().from(DB.waitingList).insert({
        style_name: styleName,
        email: email.trim(),
      });

      if (error) throw error;
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white px-5 pb-8 pt-6 shadow-xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 md:hidden" />

        {status === "success" ? (
          <div className="py-6 text-center">
            <span className="text-4xl">🎉</span>
            <p className="mt-3 text-lg font-bold">알림 등록 완료!</p>
            <p className="mt-1 text-sm text-gray-500">
              <strong>{styleName}</strong> 출시 시 이메일로 알려드릴게요.
            </p>
            <button
              onClick={onClose}
              className="mt-6 min-h-[48px] w-full rounded-xl bg-primary text-base font-bold text-white active:scale-[0.97]"
            >
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <h3 className="text-lg font-bold">{styleName}</h3>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              아직 준비 중이에요! 이메일을 남겨주시면
              <br />
              출시 알림을 보내드릴게요.
            </p>

            <input
              type="email"
              required
              placeholder="이메일 주소 입력"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-4 h-12 w-full rounded-xl border border-gray-200 px-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {status === "error" && (
              <p className="mt-2 text-sm text-red-500">
                등록에 실패했어요. 다시 시도해주세요.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
            >
              {status === "loading" ? "등록 중..." : "출시 알림 받기"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full py-2 text-sm text-gray-400"
            >
              닫기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
