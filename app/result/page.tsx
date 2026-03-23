"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ACTIVE_STYLES } from "@/lib/constants";

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-gray-400">
          로딩 중...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const tuneId = searchParams.get("tuneId") ?? "";
  const styleId = searchParams.get("style") ?? "";
  const styleName =
    ACTIVE_STYLES.find((s) => s.id === styleId)?.name ?? "AI 사진";

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Fetch generated images
  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/generate/status?tuneId=${tuneId}`);
        const data = await res.json();
        if (data.status === "completed" && data.imageUrls) {
          setImageUrls(data.imageUrls);
        }
      } catch (err) {
        console.error("Failed to fetch results:", err);
      } finally {
        setLoading(false);
      }
    }
    if (tuneId) fetchResult();
  }, [tuneId]);

  // Show upgrade popup after 3 seconds
  useEffect(() => {
    if (imageUrls.length === 0) return;
    const timer = setTimeout(() => setShowUpgradePopup(true), 3000);
    return () => clearTimeout(timer);
  }, [imageUrls]);

  function downloadSingle(url: string, index: number) {
    const downloadUrl = `/api/result/download?url=${encodeURIComponent(url)}&style=${styleId}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `chalcak-${styleId}-${index + 1}.png`;
    a.click();
  }

  async function downloadZip() {
    if (downloadingZip || imageUrls.length === 0) return;
    setDownloadingZip(true);
    try {
      const urlsParam = encodeURIComponent(JSON.stringify(imageUrls));
      const res = await fetch(
        `/api/result/download?mode=zip&urls=${urlsParam}&style=${styleId}`
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chalcak-${styleId || "photos"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP download failed:", err);
    } finally {
      setDownloadingZip(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <span className="animate-pulse text-4xl">📷</span>
          <p className="mt-3 text-sm text-gray-500">사진 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (imageUrls.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <span className="text-4xl">😢</span>
        <h1 className="mt-4 text-xl font-bold">사진을 찾을 수 없어요</h1>
        <p className="mt-2 text-sm text-gray-500">
          아직 생성 중이거나 링크가 잘못되었을 수 있어요.
        </p>
        <Link
          href="/generate"
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white"
        >
          생성 페이지로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="px-5 pt-12 pb-2 text-center md:pt-16">
        <span className="text-3xl">🎉</span>
        <h1 className="mt-2 text-xl font-bold md:text-2xl">
          {styleName} 사진 완성!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {imageUrls.length}장의 사진이 생성되었어요
        </p>
      </header>

      <div className="mx-auto max-w-lg px-5">
        {/* ID photo badge */}
        {styleId === "id-photo" && (
          <div className="mb-4 rounded-xl bg-blue-50 px-4 py-2.5 text-center text-xs font-medium text-primary">
            📐 증명사진 3×4cm 300dpi 자동 크롭 적용
          </div>
        )}

        {/* Photo grid — 2 columns on mobile */}
        <div className="grid grid-cols-2 gap-2">
          {imageUrls.map((url, i) => (
            <div key={i} className="group relative">
              <div
                className={`relative overflow-hidden rounded-xl bg-gray-100 ${
                  styleId === "id-photo" ? "aspect-[3/4]" : "aspect-square"
                }`}
              >
                <Image
                  src={url}
                  alt={`${styleName} ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {/* Download overlay */}
              <button
                onClick={() => downloadSingle(url, i)}
                className="absolute inset-x-0 bottom-0 flex min-h-[40px] items-center justify-center rounded-b-xl bg-black/50 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 active:opacity-100"
              >
                다운로드
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom — ZIP download */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg gap-2">
          <Link
            href="/"
            className="flex min-h-[48px] items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-600"
          >
            홈으로
          </Link>
          <button
            onClick={downloadZip}
            disabled={downloadingZip}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 transition active:scale-[0.97] disabled:opacity-50"
          >
            {downloadingZip
              ? "ZIP 생성 중..."
              : `전체 다운로드 (${imageUrls.length}장)`}
          </button>
        </div>
      </div>

      {/* Subscription upgrade popup */}
      {showUpgradePopup && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center"
          onClick={() => setShowUpgradePopup(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white px-5 pb-8 pt-6 shadow-xl md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 md:hidden" />
            <div className="text-center">
              <span className="text-4xl">✨</span>
              <h3 className="mt-3 text-lg font-bold">
                매달 새 사진을 받아보세요
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                월 구독으로 매달 새로운 스타일의
                <br />
                AI 사진을 생성할 수 있어요
              </p>
              <div className="mt-4 rounded-xl bg-primary/5 p-3">
                <p className="text-2xl font-extrabold text-primary">
                  월 4,900원
                  <span className="text-xs font-normal text-gray-400">
                    부터
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  매달 10장 생성 · 언제든 해지
                </p>
              </div>
              <Link
                href="/payment?style=all"
                className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white active:scale-[0.97]"
              >
                구독 시작하기
              </Link>
              <button
                onClick={() => setShowUpgradePopup(false)}
                className="mt-2 w-full py-2 text-sm text-gray-400"
              >
                다음에 할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
