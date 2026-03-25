"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ACTIVE_STYLES } from "@/lib/constants";
import { useUpload } from "@/lib/upload-context";

const POLL_INTERVAL = 30_000; // 30 seconds
const ESTIMATED_MINUTES = 25;

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-gray-400">
          로딩 중...
        </div>
      }
    >
      <GenerateContent />
    </Suspense>
  );
}

function GenerateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const upload = useUpload();
  const startedRef = useRef(false);

  const [tuneId, setTuneId] = useState(searchParams.get("tuneId") ?? "");
  const styleId = searchParams.get("style") ?? "";
  const styleName =
    ACTIVE_STYLES.find((s) => s.id === styleId)?.name ?? "AI 사진";

  const [status, setStatus] = useState<"uploading" | "processing" | "completed" | "error">(
    "uploading"
  );
  const [elapsed, setElapsed] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushDenied, setPushDenied] = useState(false);
  const [pushUnsupported, setPushUnsupported] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Check push support on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPushUnsupported(true);
    } else if (Notification.permission === "denied") {
      setPushDenied(true);
    } else if (Notification.permission === "granted") {
      // Auto-subscribe if already granted
      autoSubscribePush();
    }
  }, []);

  // 결제 완료 후 진입 시: 사진 업로드 → 모델 학습 시작
  useEffect(() => {
    if (startedRef.current || tuneId) {
      // 이미 tuneId가 있으면 업로드 단계 스킵
      if (tuneId) setStatus("processing");
      return;
    }
    startedRef.current = true;

    async function startTraining() {
      try {
        // sessionStorage에서 미리 업로드된 URL 확인 (결제 플로우)
        const stored = sessionStorage.getItem("chalcak_imageUrls");
        let imageUrls: string[] = [];

        if (stored) {
          imageUrls = JSON.parse(stored);
          sessionStorage.removeItem("chalcak_imageUrls");
        } else if (upload.files.length > 0) {
          // fallback: Context에 파일이 있으면 직접 업로드
          setStatus("uploading");
          const formData = new FormData();
          upload.files.forEach((file) => formData.append("photos", file));

          const uploadRes = await fetch("/api/upload-photos", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.error || "사진 업로드 실패");
          }

          const data = await uploadRes.json();
          imageUrls = data.imageUrls;
        } else {
          setErrorMsg("업로드할 사진이 없습니다. 다시 시도해주세요.");
          setStatus("error");
          return;
        }

        // AI 모델 학습 시작
        setStatus("processing");
        const modelRes = await fetch("/api/create-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrls, style: styleId }),
        });

        if (!modelRes.ok) {
          const err = await modelRes.json();
          throw new Error(err.error || "모델 생성 실패");
        }

        const { tuneId: newTuneId } = await modelRes.json();
        setTuneId(newTuneId);

        // Context 초기화 (메모리 해제)
        upload.reset();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
        setStatus("error");
      }
    }

    startTraining();
  }, [tuneId, styleId, upload]);

  // Poll for completion
  const checkStatus = useCallback(async () => {
    if (!tuneId) return;
    try {
      const res = await fetch(`/api/generate/status?tuneId=${tuneId}`);
      const data = await res.json();
      if (data.status === "completed") {
        setStatus("completed");
        router.push(`/result?tuneId=${tuneId}&style=${styleId}`);
      }
    } catch {
      // Silent retry on next poll
    }
  }, [tuneId, styleId, router]);

  useEffect(() => {
    if (status !== "processing") return;

    // Elapsed timer (every second)
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    // Polling (every 30s)
    const poller = setInterval(checkStatus, POLL_INTERVAL);
    // Also check immediately
    checkStatus();

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [status, checkStatus]);

  // Subscribe to push (called after permission granted)
  async function subscribePush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    // userId: searchParams에서 가져오거나 tuneId 사용
    const userId = searchParams.get("userId") || tuneId || "anonymous";

    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON(),
      }),
    });

    setPushEnabled(true);
  }

  // Auto-subscribe if permission already granted
  async function autoSubscribePush() {
    try {
      await subscribePush();
    } catch (err) {
      console.error("Auto push subscription failed:", err);
    }
  }

  // Request push notification permission (user clicks button)
  async function requestPush() {
    if (pushUnsupported) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setPushDenied(true);
        return;
      }
      if (permission !== "granted") return;

      await subscribePush();
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
  }

  const progress = Math.min((elapsed / (ESTIMATED_MINUTES * 60)) * 100, 95);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const remaining = Math.max(ESTIMATED_MINUTES - minutes, 1);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <span className="text-5xl">😥</span>
          <h1 className="mt-4 text-xl font-bold">오류가 발생했어요</h1>
          <p className="mt-2 text-sm text-gray-500">{errorMsg}</p>
          <button
            onClick={() => router.push("/upload")}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  if (status === "uploading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <span className="animate-pulse text-5xl">📤</span>
          </div>
          <h1 className="text-xl font-bold">사진 업로드 중...</h1>
          <p className="mt-2 text-sm text-gray-500">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        {/* Animated icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <span className="animate-pulse text-5xl">
            {status === "completed" ? "✅" : "🎨"}
          </span>
        </div>

        <h1 className="text-xl font-bold md:text-2xl">
          {status === "completed"
            ? "사진이 완성됐어요!"
            : `${styleName} 사진 생성 중...`}
        </h1>

        {status === "processing" && (
          <>
            {/* Progress bar */}
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Timer */}
            <p className="mt-3 text-sm text-gray-500">
              <span className="font-mono font-medium text-gray-700">
                {String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
              </span>
              {" "}경과 · 약 {remaining}분 남음
            </p>

            {/* Steps */}
            <div className="mt-8 space-y-3 text-left">
              <Step
                done={elapsed > 0}
                active={elapsed < 60}
                label="AI 모델 학습 준비"
              />
              <Step
                done={elapsed >= 60}
                active={elapsed >= 60 && elapsed < 600}
                label="얼굴 특징 분석 중"
              />
              <Step
                done={elapsed >= 600}
                active={elapsed >= 600 && elapsed < 1200}
                label="스타일 적용 중"
              />
              <Step
                done={false}
                active={elapsed >= 1200}
                label="최종 보정 중"
              />
            </div>

            {/* Push notification prompt */}
            {pushEnabled && (
              <div className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-green-50 p-4">
                <span className="text-lg">✅</span>
                <p className="text-sm font-medium text-green-700">
                  완료 시 푸시 알림을 보내드릴게요
                </p>
              </div>
            )}
            {!pushEnabled && !pushDenied && !pushUnsupported && (
              <button
                onClick={requestPush}
                className="mt-8 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 transition active:scale-[0.97]"
              >
                🔔 완료 알림 받기
              </button>
            )}
            {pushDenied && (
              <div className="mt-8 rounded-xl bg-orange-50 p-4 text-center">
                <p className="text-sm font-medium text-orange-700">
                  🔕 알림이 차단되어 있어요
                </p>
                <p className="mt-1 text-xs text-orange-500">
                  브라우저 설정에서 알림을 허용해주세요
                </p>
              </div>
            )}
            {pushUnsupported && (
              <div className="mt-8 rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-sm font-medium text-gray-600">
                  📧 이 브라우저는 푸시 알림을 지원하지 않아요
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  완료 시 이메일로 알려드립니다
                </p>
              </div>
            )}

            {/* Close safe message */}
            <p className="mt-4 text-xs text-gray-400">
              이 화면을 닫아도 괜찮아요.
              <br />
              완료 시 {pushEnabled ? "푸시 알림과 " : ""}이메일로 알려드립니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Step({
  done,
  active,
  label,
}: {
  done: boolean;
  active: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? "bg-primary text-white"
            : active
              ? "animate-pulse border-2 border-primary text-primary"
              : "border-2 border-gray-200 text-gray-300"
        }`}
      >
        {done ? "✓" : ""}
      </div>
      <span
        className={`text-sm ${
          done
            ? "font-medium text-gray-700"
            : active
              ? "font-medium text-primary"
              : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
