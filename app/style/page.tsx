"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACTIVE_STYLES, COMING_SOON_STYLES } from "@/lib/constants";
import { useUpload, type Gender } from "@/lib/upload-context";
import ComingSoonModal from "@/components/ComingSoonModal";

export default function StylePage() {
  const router = useRouter();
  const upload = useUpload();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(upload.style);
  const [gender, setGender] = useState<Gender>(upload.gender);
  const [modalStyle, setModalStyle] = useState<string | null>(null);

  function handleNext() {
    if (!selectedStyle) return;
    upload.setStyle(selectedStyle);
    upload.setGender(gender);
    router.push(`/payment?style=${selectedStyle}`);
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <header className="px-5 pt-12 pb-4 text-center md:pt-16">
        <h1 className="text-xl font-bold md:text-2xl">스타일 선택</h1>
        <p className="mt-1 text-sm text-gray-500">
          어떤 스타일의 사진을 만들까요?
        </p>
      </header>

      <div className="mx-auto max-w-lg px-5">
        {/* Gender selection */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-semibold text-gray-700">성별</p>
          <div className="flex gap-2">
            {([
              { value: "female" as Gender, label: "여성", emoji: "👩" },
              { value: "male" as Gender, label: "남성", emoji: "👨" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGender(opt.value)}
                className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition active:scale-[0.97] ${
                  gender === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Styles */}
        <div className="grid grid-cols-2 gap-3">
          {ACTIVE_STYLES.map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`rounded-2xl border-2 p-4 text-center transition active:scale-[0.97] md:p-5 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-3xl md:text-4xl">{style.emoji}</span>
                <h3 className="mt-2 text-sm font-bold md:text-base">
                  {style.name}
                </h3>
                <p className="mt-1 text-xs leading-snug text-gray-400">
                  {style.desc}
                </p>
                {isSelected && (
                  <span className="mt-2 inline-block rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
                    선택됨
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Coming Soon */}
        <div className="mt-10">
          <h3 className="text-center text-sm font-semibold text-gray-400">
            Coming Soon
          </h3>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {COMING_SOON_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setModalStyle(style.name)}
                className="relative rounded-xl border border-gray-100 bg-white p-3 text-center opacity-40 transition hover:opacity-60 active:scale-[0.97] md:p-4"
              >
                <span className="text-2xl md:text-3xl">{style.emoji}</span>
                <p className="mt-1 text-xs font-medium md:text-sm">
                  {style.name}
                </p>
                <span className="absolute right-1.5 top-1.5 text-xs">🔒</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {modalStyle && (
        <ComingSoonModal
          styleName={modalStyle}
          onClose={() => setModalStyle(null)}
        />
      )}

      {/* Fixed bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="shrink-0 text-sm text-gray-500">
            {selectedStyle ? (
              <span className="font-bold text-primary">
                {ACTIVE_STYLES.find((s) => s.id === selectedStyle)?.name}
              </span>
            ) : (
              "스타일을 선택하세요"
            )}
          </div>
          <button
            onClick={handleNext}
            disabled={!selectedStyle}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 transition active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
          >
            결제하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
