import Link from "next/link";

export const metadata = {
  title: "고객센터 | 찰칵AI",
};

const SUPPORT_ITEMS = [
  {
    icon: "📧",
    title: "이메일 문의",
    desc: "평일 10:00~18:00 (공휴일 제외)",
    action: "support@chalcak.ai",
    href: "mailto:support@chalcak.ai",
  },
  {
    icon: "💬",
    title: "카카오톡 채널",
    desc: "실시간 채팅 상담",
    action: "찰칵AI 채널 추가",
    href: "#",
  },
  {
    icon: "📱",
    title: "인스타그램 DM",
    desc: "@chalcak.ai",
    action: "DM 보내기",
    href: "#",
  },
] as const;

const COMMON_QUESTIONS = [
  {
    q: "결제했는데 사진이 생성되지 않아요",
    a: "AI 모델 학습에 약 10~15분이 소요됩니다. 학습 완료 후 자동으로 사진이 생성되며, 이메일과 푸시 알림으로 안내드립니다. 30분 이상 소요되는 경우 이메일로 문의해 주세요.",
  },
  {
    q: "생성된 사진이 실물과 다른 것 같아요",
    a: "AI 사진의 품질은 업로드한 사진의 수와 다양성에 따라 달라집니다. 12장 이상의 다양한 각도·조명의 사진을 업로드하시면 더 나은 결과를 얻을 수 있습니다.",
  },
  {
    q: "환불은 어떻게 하나요?",
    a: "AI 모델 학습 시작 전이라면 전액 환불 가능합니다. 학습 시작 후에는 크레딧으로 전환됩니다. 증명사진 규격 불합격 시에는 전액 환불해 드립니다. 이메일로 주문번호와 함께 문의해 주세요.",
  },
  {
    q: "구독을 해지하고 싶어요",
    a: "대시보드 → 구독 관리에서 해지할 수 있습니다. 해지 시 다음 결제일부터 적용되며, 현재 결제 기간까지는 정상 이용 가능합니다.",
  },
  {
    q: "업로드한 사진은 어떻게 처리되나요?",
    a: "업로드된 원본 사진은 AI 모델 학습이 완료되는 즉시 서버에서 영구 삭제됩니다. 생성된 결과 사진만 대시보드에 보관되며, 직접 삭제할 수 있습니다.",
  },
  {
    q: "증명사진 규격이 맞지 않아요",
    a: "증명사진은 3×4cm 300dpi 규격으로 자동 크롭됩니다. 규격 불합격 시 전액 환불 정책을 적용합니다. 문제 발생 시 이메일로 문의해 주세요.",
  },
] as const;

export default function SupportPage() {
  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-gray-100 px-5 pt-12 pb-6 md:pt-16">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            &larr; 홈으로
          </Link>
          <h1 className="mt-3 text-2xl font-bold md:text-3xl">고객센터</h1>
          <p className="mt-1 text-sm text-gray-500">
            무엇을 도와드릴까요?
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8">
        {/* Contact channels */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {SUPPORT_ITEMS.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:shadow-md"
            >
              <span className="text-3xl">{item.icon}</span>
              <h3 className="mt-3 text-sm font-bold">{item.title}</h3>
              <p className="mt-1 text-xs text-gray-400">{item.desc}</p>
              <span className="mt-3 text-sm font-semibold text-primary">
                {item.action}
              </span>
            </a>
          ))}
        </div>

        {/* Response time notice */}
        <div className="mt-6 rounded-xl bg-blue-50 p-4 text-center text-sm text-gray-600">
          이메일 문의는 <span className="font-semibold text-primary">영업일 기준 24시간 이내</span> 답변드립니다.
        </div>

        {/* Common questions */}
        <h2 className="mt-12 text-lg font-bold md:text-xl">자주 묻는 문의</h2>
        <div className="mt-4 space-y-3">
          {COMMON_QUESTIONS.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-gray-200 bg-white"
            >
              <summary className="flex min-h-[48px] cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="ml-2 text-gray-300 transition group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-gray-500">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        {/* Links */}
        <div className="mt-12 flex items-center justify-center gap-4 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-gray-600">이용약관</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-gray-600">개인정보처리방침</Link>
        </div>
      </main>
    </div>
  );
}
