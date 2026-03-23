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
        나만의 AI 사진작가
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-gray-500 md:text-lg">
        셀카 5장으로 증명사진부터
        <br className="md:hidden" /> 카카오·인스타 프로필까지
      </p>
      <Link
        href="/upload"
        className="mt-8 inline-flex min-h-[48px] items-center rounded-xl bg-primary px-8 text-base font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark active:scale-[0.97] md:text-lg"
      >
        지금 체험하기 2,900원&nbsp;&rarr;
      </Link>
      <p className="mt-3 text-xs text-gray-400">
        카드 등록 없이 바로 시작
      </p>
    </section>
  );
}

/* ────────────────── Style Packs ────────────────── */
function StylePacks() {
  return (
    <section id="styles" className="bg-gray-50 px-5 py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-xl font-bold md:text-3xl">
          스타일팩
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 md:text-base">
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
                  {plan.credits}장 생성
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
        지금 체험하기 2,900원&nbsp;&rarr;
      </Link>
    </div>
  );
}

/* ────────────────── Page ────────────────── */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <StylePacks />
      <Pricing />
      <PwaBanner />
      <Faq />
      <Footer />
      <MobileCta />
    </>
  );
}
