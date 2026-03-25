"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PLANS, ACTIVE_STYLES, type PlanKey } from "@/lib/constants";
import { useUpload } from "@/lib/upload-context";

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-gray-400">
          로딩 중...
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const styleId = searchParams.get("style") ?? "";
  const styleName =
    ACTIVE_STYLES.find((s) => s.id === styleId)?.name ?? "스타일";

  const upload = useUpload();
  const planKeys = Object.keys(PLANS) as PlanKey[];
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("trial");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const plan = PLANS[selectedPlan];

  async function handlePayment() {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // 1. 결제 전에 사진을 Supabase Storage에 미리 업로드
      if (upload.files.length > 0) {
        // 모바일 사진 리사이즈 (4000px→1024px, ~8MB→~200KB)
        const { resizeImage } = await import("@/lib/resize-image");
        setStatusMsg(`사진 최적화 중... (0/${upload.files.length})`);

        const resized: File[] = [];
        for (let i = 0; i < upload.files.length; i++) {
          resized.push(await resizeImage(upload.files[i]));
          setStatusMsg(`사진 최적화 중... (${i + 1}/${upload.files.length})`);
        }

        // 1장씩 개별 업로드 (Vercel 4.5MB body 제한 대응)
        const imageUrls: string[] = [];
        for (let i = 0; i < resized.length; i++) {
          setStatusMsg(`사진 업로드 중... (${i + 1}/${resized.length})`);
          const formData = new FormData();
          formData.append("photos", resized[i]);

          const uploadRes = await fetch("/api/upload-photos", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.error || "사진 업로드 실패");
          }

          const data = await uploadRes.json();
          imageUrls.push(...data.imageUrls);
        }
        // sessionStorage에 저장 (토스 결제 후 돌아왔을 때 사용)
        sessionStorage.setItem("chalcak_imageUrls", JSON.stringify(imageUrls));
      }

      // 2. 토스 결제 요청
      setStatusMsg("결제 준비 중...");
      const { loadTossPayments } = await import(
        "@tosspayments/payment-sdk"
      );
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      );

      const orderId = `order_${Date.now()}_${selectedPlan}`;
      const orderName = `찰칵AI ${plan.label}${plan.type === "subscription" ? " 구독" : "권"}`;

      if (plan.type === "one-time") {
        // 1회성 결제 (체험)
        await tossPayments.requestPayment("카드", {
          amount: plan.price,
          orderId,
          orderName,
          successUrl: `${window.location.origin}/api/payment/confirm?plan=${selectedPlan}&style=${styleId}`,
          failUrl: `${window.location.origin}/payment?style=${styleId}&error=failed`,
        });
      } else {
        // 정기결제 빌링키 발급
        await tossPayments.requestBillingAuth("카드", {
          customerKey: `cust_${Date.now()}`,
          successUrl: `${window.location.origin}/api/payment/confirm?plan=${selectedPlan}&style=${styleId}&type=billing`,
          failUrl: `${window.location.origin}/payment?style=${styleId}&error=failed`,
        });
      }
    } catch (err) {
      setStatusMsg("");
      if (err instanceof Error && err.message !== "사진 업로드 실패") {
        // 토스 결제창 닫기 등은 에러 아님
      }
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="px-5 pt-12 pb-4 text-center md:pt-16">
        <h1 className="text-xl font-bold md:text-2xl">결제하기</h1>
        <p className="mt-1 text-sm text-gray-500">
          <span className="font-medium text-primary">{styleName}</span> 스타일
          사진을 만들어보세요
        </p>
      </header>

      <div className="mx-auto max-w-lg px-5">
        {/* Plan selection */}
        <div className="space-y-3">
          {planKeys.map((key) => {
            const p = PLANS[key];
            const isSelected = selectedPlan === key;
            const isRecommended = key === "pro";
            return (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition active:scale-[0.99] md:p-5 ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Radio indicator */}
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-primary" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold md:text-base">
                      {p.label}
                    </span>
                    {isRecommended && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                        추천
                      </span>
                    )}
                    {p.type === "subscription" && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        월 구독
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {p.credits}장 생성
                    {p.type === "subscription" ? " / 월" : ""}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-lg font-extrabold md:text-xl">
                    {p.price.toLocaleString()}
                    <span className="text-xs font-normal text-gray-400">
                      원
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="mt-6 rounded-2xl bg-gray-50 p-4">
          <h3 className="text-sm font-bold">주문 요약</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">스타일</span>
              <span className="font-medium">{styleName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">플랜</span>
              <span className="font-medium">{plan.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">생성 가능</span>
              <span className="font-medium">{plan.credits}장</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between">
                <span className="font-bold">결제 금액</span>
                <span className="text-lg font-extrabold text-primary">
                  {plan.price.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="mt-4 text-center text-xs leading-relaxed text-gray-400">
          {plan.type === "subscription"
            ? "매월 자동 결제되며, 언제든 구독을 해지할 수 있습니다."
            : "1회성 결제이며, 추가 과금은 없습니다."}
          <br />
          결제 후 AI 학습이 시작되며 약 10~15분 소요됩니다.
        </p>

        {/* Error message */}
        {searchParams.get("error") && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
            결제에 실패했습니다. 다시 시도해주세요.
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 transition active:scale-[0.97] disabled:opacity-50"
          >
            {isLoading
              ? statusMsg || "결제 준비 중..."
              : `${plan.price.toLocaleString()}원 결제하기`}
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            토스페이먼츠 안전결제
          </p>
        </div>
      </div>
    </div>
  );
}
