const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'instagram-posts', 'screenshots');

// Mobile viewport (iPhone 14 Pro size)
const MOBILE_VP = { width: 393, height: 852, deviceScaleFactor: 2 };
// Desktop viewport
const DESKTOP_VP = { width: 1280, height: 900, deviceScaleFactor: 2 };

const BASE_URL = 'http://localhost:3000';
const BYPASS = '_bypass=screenshot';

// Protected paths need bypass param
const screenshots = [
  // Post 01 — 프로젝트 시작: 랜딩페이지 히어로
  {
    name: '01-landing-hero',
    url: '/',
    viewport: MOBILE_VP,
    fullPage: false,
    description: 'Landing page hero section (mobile)',
  },
  // Post 02 — 기술 스택: 랜딩페이지 전체 (데스크탑)
  {
    name: '02-landing-desktop',
    url: '/',
    viewport: DESKTOP_VP,
    fullPage: true,
    description: 'Full landing page (desktop)',
  },
  // Post 03 — 카카오 로그인: 로그인 페이지
  {
    name: '03-login',
    url: '/login',
    viewport: MOBILE_VP,
    fullPage: false,
    description: 'Login page with Kakao login',
  },
  // Post 04 — 토스페이먼츠 결제: 결제 페이지
  {
    name: '04-payment',
    url: '/payment',
    viewport: MOBILE_VP,
    fullPage: true,
    description: 'Payment page with TossPayments',
  },
  // Post 05 — AI 사진 생성: 생성 대기 페이지
  {
    name: '05-generate',
    url: `/generate?${BYPASS}`,
    viewport: MOBILE_VP,
    fullPage: false,
    description: 'AI generation waiting page',
  },
  // Post 06 — 모바일 PWA: 랜딩 모바일 전체
  {
    name: '06-pwa-mobile',
    url: '/',
    viewport: MOBILE_VP,
    fullPage: true,
    description: 'Full mobile landing (PWA standalone feel)',
  },
  // Post 07 — 사진 업로드 UX: 업로드 페이지
  {
    name: '07-upload',
    url: `/upload?${BYPASS}`,
    viewport: MOBILE_VP,
    fullPage: true,
    description: 'Photo upload page with camera/album buttons',
  },
  // Post 08 — 랜딩페이지 차별화: 비교 테이블 섹션 스크롤 캡처
  {
    name: '08-landing-comparison',
    url: '/',
    viewport: MOBILE_VP,
    fullPage: false,
    description: 'Landing comparison table section (mobile)',
    scrollToText: '왜 찰칵AI인가요',
  },
  // Post 09 — 경쟁 분석: 스타일 선택 페이지
  {
    name: '09-style',
    url: `/style?${BYPASS}`,
    viewport: MOBILE_VP,
    fullPage: true,
    description: 'Style selection page',
  },
  // Post 10 — 로드맵: 스타일 페이지 Coming Soon 포함
  {
    name: '10-style-coming-soon',
    url: `/style?${BYPASS}`,
    viewport: DESKTOP_VP,
    fullPage: true,
    description: 'Style page with Coming Soon styles (desktop)',
  },
  // Bonus: 랜딩 차별점 섹션
  {
    name: '08b-differentiators',
    url: '/',
    viewport: MOBILE_VP,
    fullPage: false,
    description: 'Differentiator section',
    scrollToText: '찰칵AI가 다른 이유',
  },
  // Bonus: 가격표 섹션
  {
    name: '04b-pricing',
    url: '/#pricing',
    viewport: MOBILE_VP,
    fullPage: false,
    description: 'Pricing section (mobile)',
    scrollToText: '합리적인 가격',
  },
];

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const shot of screenshots) {
    console.log(`📸 Capturing: ${shot.name} — ${shot.description}`);
    const page = await browser.newPage();
    await page.setViewport(shot.viewport);

    try {
      await page.goto(`${BASE_URL}${shot.url}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for fonts/animations
      await new Promise((r) => setTimeout(r, 1500));

      // Scroll to specific text if needed
      if (shot.scrollToText) {
        await page.evaluate((text) => {
          const el = [...document.querySelectorAll('h2, h3, section')].find(
            (e) => e.textContent.includes(text)
          );
          if (el) {
            el.scrollIntoView({ block: 'start', behavior: 'instant' });
            window.scrollBy(0, -20); // small offset
          }
        }, shot.scrollToText);
        await new Promise((r) => setTimeout(r, 500));
      }

      const filePath = path.join(OUTPUT_DIR, `${shot.name}.png`);
      await page.screenshot({
        path: filePath,
        fullPage: shot.fullPage,
        type: 'png',
      });

      console.log(`  ✅ Saved: ${filePath}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${shot.name} — ${err.message}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\n🎉 All screenshots captured!');
}

main().catch(console.error);
