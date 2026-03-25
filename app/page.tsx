import Link from "next/link";
import {
  PLANS,
  ACTIVE_STYLES,
  COMING_SOON_STYLES,
  FAQ_ITEMS,
} from "@/lib/constants";

/* ────────────────────── Hero ────────────────────── */
function Hero() {
  return (
    <section className="px-5 pt-16 pb-12 text-center md:pt-24 md:pb-20">
      <p className="mb-3 text-sm font-semibold tracking-wide text-primary md:text-base">
        한국인 특화 AI 사진 서비스
      </p>
      <h1 className="text-[28px] font-extrabold leading-tight md:text-5xl">
        AI가 나를 기억합니다
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-gray-500 md:text-lg">
        셀카 8장으로 나만의 프로필 사진을
        <br /> 어떤 사진이 필요하신가요?
      </p>
      <p className="mt-2 text-sm font-medium text-gray-700 md:text-base">
        사진관 3만원 → 찰칵AI 2,900원 체험
      </p>
      <Link
        href="/upload"
        className="mt-8 inline-flex min-h-[48px] items-center rounded-xl bg-primary px-8 text-base font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark active:scale-[0.97] md:text-lg"
      >
        지금 체험하기&nbsp;&rarr;
      </Link>
      <p className="mt-3 text-xs text-gray-400">
        카드 등록 없이 바로 시작
      </p>

      {/* Trust Badges */}
      <div className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-2 md:gap-3">
        {[
          { icon: "🔒", text: "생성 완료 후 원본 즉시 삭제" },
          { icon: "🇰🇷", text: "한국인이 만든 한국인을 위한 서비스" },
          { icon: "✅", text: "규격 불합격 시 전액 환불" },
        ].map((badge) => (
          <span
            key={badge.text}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 md:text-sm"
          >
            <span>{badge.icon}</span>
            {badge.text}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ────────────── Differentiators ────────────── */
const DIFFERENTIATORS = [
  {
    icon: "🧠",
    title: "AI가 나를 학습합니다",
    desc: "캔바·망고보드는 가상 인물을 만듭니다. 찰칵AI는 내 얼굴을 직접 학습해 내가 찍지 않은 수백 장의 사진을 생성합니다.",
  },
  {
    icon: "📋",
    title: "한국 공공서류 합격 보장",
    desc: "주민등록증·운전면허·여권 규격 자동 검증. 중국산 앱의 서류 반려 걱정 없이 국내 규격에 최적화된 증명사진을 만듭니다.",
  },
  {
    icon: "📱",
    title: "카카오·인스타 한국 감성 특화",
    desc: "글로벌 서비스는 한국 감성을 모릅니다. 카카오톡 프로필, 인스타그램 피드에 딱 맞는 한국인 취향 스타일팩을 제공합니다.",
  },
  {
    icon: "♾️",
    title: "한 번 등록, 매달 새로운 사진",
    desc: "한 번 만든 내 AI 모델은 영구 보존. 봄 프로필, 취업 사진, 크리스마스 프로필… 매달 새로운 스타일로 사진을 만드세요.",
  },
] as const;

function Differentiators() {
  return (
    <section className="bg-gray-50 px-5 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-xl font-bold md:text-3xl">
          찰칵AI가 다른 이유
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {DIFFERENTIATORS.map((d) => (
            <div
              key={d.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:shadow-md md:p-6"
            >
              <span className="text-4xl md:text-5xl">{d.icon}</span>
              <h3 className="mt-3 text-sm font-bold md:text-base">{d.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-500 md:text-sm">
                {d.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────── Style Packs ────────────────── */
function StylePacks() {
  return (
    <section id="styles" className="px-5 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-xl font-bold md:text-3xl">
          내 얼굴로 만드는 스타일
        </h2>
        <p className="mt-2 text-center text-[13px] text-gray-400">
          캔바·망고보드와 달리, 모든 사진은 실제 나의 얼굴로 생성됩니다
        </p>
        <p className="mt-1 text-center text-sm text-gray-500 md:text-base">
          원하는 스타일을 골라 AI 사진을 받아보세요
        </p>

        {/* Active */}
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {ACTIVE_STYLES.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md md:p-6"
            >
              <span className="text-3xl md:text-4xl">{s.emoji}</span>
              <h3 className="mt-3 text-sm font-bold md:text-base">{s.name}</h3>
              <p className="mt-1 text-xs leading-snug text-gray-400 md:text-sm">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Coming Soon */}
        <h3 className="mt-10 text-center text-sm font-semibold text-gray-400 md:text-base">
          Coming Soon
        </h3>
        <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-4">
          {COMING_SOON_STYLES.map((s) => (
            <div
              key={s.id}
              className="relative rounded-xl border border-gray-100 bg-white p-3 text-center opacity-40 md:p-4"
            >
              <span className="text-2xl md:text-3xl">{s.emoji}</span>
              <p className="mt-1 text-xs font-medium md:text-sm">{s.name}</p>
              <span className="absolute right-1.5 top-1.5 text-xs">🔒</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────── Comparison Table ────────────── */
const COMPARISON_ROWS = [
  { feature: "내 얼굴 AI 학습", china: "✗", canva: "✗", chalcak: "✅" },
  { feature: "한국 규격 자동 검증", china: "△ 불안정", canva: "✗", chalcak: "✅" },
  { feature: "카카오·인스타 특화", china: "✗", canva: "✗", chalcak: "✅" },
  { feature: "월 구독 (매달 새 사진)", china: "✗", canva: "✅", chalcak: "✅" },
  { feature: "생성 후 원본 즉시 삭제", china: "✗", canva: "△", chalcak: "✅" },
  { feature: "한국 기업 서비스", china: "✗", canva: "✗", chalcak: "✅" },
] as const;

function ComparisonTable() {
  return (
    <section className="bg-gray-50 px-5 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-xl font-bold md:text-3xl">
          왜 찰칵AI인가요?
        </h2>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-semibold text-gray-700">기능</th>
                <th className="px-4 py-3 font-semibold text-gray-500">중국산 앱</th>
                <th className="px-4 py-3 font-semibold text-gray-500">캔바/망고보드</th>
                <th className="bg-[#EFF6FF] px-4 py-3 font-bold text-[#2563EB]">찰칵AI</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-gray-50 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-gray-700">{row.feature}</td>
                  <td className="px-4 py-3 text-gray-400">{row.china}</td>
                  <td className="px-4 py-3 text-gray-400">{row.canva}</td>
                  <td className="bg-[#EFF6FF] px-4 py-3">{row.chalcak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ────────────────── Pricing ────────────────── */
function Pricing() {
  const planKeys = Object.keys(PLANS) as (keyof typeof PLANS)[];

  return (
    <section id="pricing" className="px-5 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-xl font-bold md:text-3xl">
          합리적인 가격
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 md:text-base">
          필요한 만큼만, 부담 없이 시작하세요
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {planKeys.map((key) => {
            const plan = PLANS[key];
            const isRecommended = key === "pro";
            return (
              <div
                key={key}
                className={`relative rounded-2xl border p-5 text-center transition md:p-6 ${
                  isRecommended
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-gray-200 bg-white"
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-white">
                    추천
                  </span>
                )}
                <p className="text-sm font-semibold text-gray-500">
                  {plan.label}
                </p>
                <p className="mt-2 text-2xl font-extrabold md:text-3xl">
                  {plan.price.toLocaleString()}
                  <span className="text-sm font-normal text-gray-400">원</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {plan.type === "subscription"
                    ? `월 ${plan.credits}장 생성`
                    : `${plan.credits}장 생성`}
                </p>
                <Link
                  href="/upload"
                  className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-bold transition active:scale-[0.97] ${
                    isRecommended
                      ? "bg-primary text-white shadow-sm hover:bg-primary-dark"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  시작하기
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ────────────────── PWA Banner ────────────────── */
function PwaBanner() {
  return (
    <section className="bg-primary/5 px-5 py-6 text-center md:py-8">
      <p className="text-sm font-medium text-primary md:text-base">
        📱 홈 화면에 추가해서 앱처럼 사용하세요
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Safari 공유 버튼 → &quot;홈 화면에 추가&quot; · Android Chrome 메뉴 →
        &quot;홈 화면에 추가&quot;
      </p>
    </section>
  );
}

/* ────────────────── FAQ ────────────────── */
function Faq() {
  return (
    <section id="faq" className="bg-gray-50 px-5 py-12 md:py-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-xl font-bold md:text-3xl">
          자주 묻는 질문
        </h2>
        <div className="mt-8 space-y-4">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-gray-200 bg-white"
            >
              <summary className="flex min-h-[48px] cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold md:text-base [&::-webkit-details-marker]:hidden">
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
      </div>
    </section>
  );
}

/* ────────────────── Footer ────────────────── */
function Footer() {
  return (
    <footer className="border-t border-gray-100 px-5 pb-28 pt-8 text-center text-xs text-gray-400 md:pb-8">
      <p>© 2024 찰칵AI. All rights reserved.</p>
      <p className="mt-1">
        <a href="#" className="hover:text-gray-600">
          이용약관
        </a>
        {" · "}
        <a href="#" className="hover:text-gray-600">
          개인정보처리방침
        </a>
        {" · "}
        <a href="#" className="hover:text-gray-600">
          고객센터
        </a>
      </p>
    </footer>
  );
}

/* ────────────── Mobile Fixed CTA ────────────── */
function MobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm md:hidden">
      <Link
        href="/upload"
        className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 active:scale-[0.97]"
      >
        지금 체험하기&nbsp;&rarr;
      </Link>
    </div>
  );
}

/* ────────────────── Page ────────────────── */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Differentiators />
      <StylePacks />
      <ComparisonTable />
      <Pricing />
      <PwaBanner />
      <Faq />
      <Footer />
      <MobileCta />
    </>
  );
}
