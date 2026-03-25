const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'instagram-posts');
const SHOTS = path.join(OUT, 'screenshots');
const SIZE = 1080;

// ── Post definitions ─────────────────────────────────
const posts = [
  {
    id: '01',
    title: '왜 찰칵AI를\n만들게 되었나',
    subtitle: '개발일지 #1',
    emoji: '💡',
    color: '#2563EB',
    slides: [
      { type: 'cover' },
      { type: 'screenshot', file: '01-landing-hero.png', label: '모바일 랜딩페이지' },
      {
        type: 'text',
        heading: '시작 동기',
        bullets: [
          '사진관 3만원 → AI로 2,900원',
          '중국산 앱은 한국 규격 미지원',
          '내 얼굴 학습 → 무한 생성',
          '1인 개발자의 도전',
        ],
      },
      { type: 'cta', text: '찰칵AI 체험하기\n2,900원부터', emoji: '📸' },
    ],
  },
  {
    id: '02',
    title: '기술 스택\n선택의 이유',
    subtitle: '개발일지 #2',
    emoji: '⚙️',
    color: '#059669',
    slides: [
      { type: 'cover' },
      { type: 'screenshot', file: '02-landing-desktop.png', label: '데스크탑 랜딩페이지' },
      {
        type: 'text',
        heading: '우리의 기술 스택',
        bullets: [
          'Next.js 14 — 서버 컴포넌트',
          'Supabase — DB + 인증 + 스토리지',
          'Astria.ai — DreamBooth AI 학습',
          '토스페이먼츠 — 한국 결제',
          'Vercel — 자동 배포',
        ],
      },
      {
        type: 'text',
        heading: '왜 이 조합인가?',
        bullets: [
          '1인 개발에 최적화된 풀스택',
          '서버 비용 최소화 (서버리스)',
          '한국 서비스에 필요한 것만',
        ],
      },
    ],
  },
  {
    id: '03',
    title: '카카오 로그인\n구현기',
    subtitle: '개발일지 #3',
    emoji: '💬',
    color: '#F59E0B',
    slides: [
      { type: 'cover' },
      { type: 'screenshot', file: '03-login.png', label: '로그인 페이지' },
      {
        type: 'text',
        heading: '왜 카카오 로그인?',
        bullets: [
          '한국인 93%가 카카오톡 사용',
          '이메일 입력 없이 3초 회원가입',
          'Supabase OAuth로 간단 연동',
          '이메일 로그인도 백업으로 제공',
        ],
      },
    ],
  },
  {
    id: '04',
    title: '토스페이먼츠\n결제 연동',
    subtitle: '개발일지 #4',
    emoji: '💳',
    color: '#2563EB',
    slides: [
      { type: 'cover' },
      { type: 'screenshot', file: '04-payment.png', label: '결제 페이지' },
      { type: 'screenshot', file: '04b-pricing.png', label: '가격 정책' },
      {
        type: 'text',
        heading: '가장 어려웠던 버그',
        bullets: [
          '결제 후 사진 데이터 유실 😱',
          '리다이렉트 시 세션 데이터 소실',
          '3일간 디버깅...',
          'Supabase 임시 저장으로 해결 ✅',
        ],
      },
    ],
  },
  {
    id: '05',
    title: 'AI 사진 생성의\n비밀',
    subtitle: '개발일지 #5',
    emoji: '🧠',
    color: '#7C3AED',
    slides: [
      { type: 'cover' },
      { type: 'screenshot', file: '05-generate.png', label: 'AI 생성 대기 화면' },
      {
        type: 'text',
        heading: 'DreamBooth 기술',
        bullets: [
          '1️⃣ 셀카 5장 업로드',
          '2️⃣ AI가 내 얼굴 특징 학습 (15분)',
          '3️⃣ 학습된 모델로 사진 생성 (30초)',
          '',
          '"가상 인물"이 아닌',
          '"실제 나"를 학습합니다',
        ],
      },
      {
        type: 'text',
        heading: '한 번 학습하면',
        bullets: [
          '증명사진 · 정장 · 카카오 · 인스타',
          '스타일만 바꿔가며 무한 생성 ♾️',
          '추가 촬영 불필요',
        ],
      },
    ],
  },
  {
    id: '06',
    title: '모바일 퍼스트\nPWA',
    subtitle: '개발일지 #6',
    emoji: '📱',
    color: '#0891B2',
    slides: [
      { type: 'cover' },
      { type: 'screenshot', file: '06-pwa-mobile.png', label: '모바일 전체 화면' },
      {
        type: 'text',
        heading: 'PWA = 앱 없는 앱',
        bullets: [
          '✅ 홈 화면 아이콘 추가',
          '✅ 전체 화면 (standalone)',
          '✅ 오프라인 지원',
          '✅ 푸시 알림',
          '',
          'iOS + Android 동시 지원',
          '앱스토어 심사 불필요',
        ],
      },
    ],
  },
  {
    id: '07',
    title: '사진 업로드\nUX 개선기',
    subtitle: '개발일지 #7',
    emoji: '📸',
    color: '#DC2626',
    slides: [
      { type: 'cover' },
      { type: 'screenshot', file: '07-upload.png', label: '업로드 페이지' },
      {
        type: 'text',
        heading: 'Before → After',
        bullets: [
          '❌ 모바일 카메라 직접 촬영 안 됨',
          '❌ PC에서 촬영 버튼 뜨면 혼란',
          '❌ 어떤 사진을 올릴지 모름',
          '',
          '✅ 모바일: 촬영/앨범 버튼 분리',
          '✅ PC: 파일 업로드만 표시',
          '✅ 좋은 셀카 가이드 제공',
        ],
      },
    ],
  },
  {
    id: '08',
    title: '랜딩페이지\n차별화 전략',
    subtitle: '개발일지 #8',
    emoji: '🔄',
    color: '#2563EB',
    slides: [
      { type: 'cover' },
      { type: 'screenshot', file: '08b-differentiators.png', label: '찰칵AI가 다른 이유' },
      { type: 'screenshot', file: '08-landing-comparison.png', label: '경쟁사 비교 테이블' },
      {
        type: 'text',
        heading: '핵심 변경',
        bullets: [
          'Before: "나만의 AI 사진작가"',
          'After: "AI가 나를 기억합니다"',
          '',
          '✅ 신뢰 뱃지 추가',
          '✅ 차별점 4가지 명시',
          '✅ 가격 앵커링',
        ],
      },
    ],
  },
  {
    id: '09',
    title: '경쟁 분석:\n왜 찰칵AI인가',
    subtitle: '개발일지 #9',
    emoji: '🔍',
    color: '#059669',
    slides: [
      { type: 'cover' },
      { type: 'screenshot', file: '09-style.png', label: '스타일 선택 페이지' },
      {
        type: 'text',
        heading: '경쟁사 비교',
        bullets: [
          '🔴 중국산 앱 (Snow, Meitu)',
          '→ 한국 서류 규격 미지원',
          '→ 개인정보 서버가 중국에',
          '',
          '🟡 캔바 / 망고보드',
          '→ 가상 인물만 가능',
          '',
          '🟢 찰칵AI',
          '→ 내 얼굴 학습 + 한국 규격',
        ],
      },
    ],
  },
  {
    id: '10',
    title: '앞으로의\n로드맵',
    subtitle: '개발일지 #10',
    emoji: '🚀',
    color: '#7C3AED',
    slides: [
      { type: 'cover' },
      { type: 'screenshot', file: '10-style-coming-soon.png', label: 'Coming Soon 스타일팩' },
      {
        type: 'text',
        heading: 'Coming Soon',
        bullets: [
          '🔜 웨딩 화보',
          '🔜 시즌 컨셉 (봄/여름/가을/겨울)',
          '🔜 쇼핑몰 모델',
          '🔜 유튜브 썸네일',
          '🔜 AI 영상',
          '🔜 3D 아바타',
        ],
      },
      { type: 'cta', text: '찰칵AI 체험하기\n2,900원부터', emoji: '✨' },
    ],
  },
];

// ── HTML Templates ───────────────────────────────────

function coverHTML(post) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${SIZE}px; height:${SIZE}px; display:flex; align-items:center; justify-content:center;
    background: linear-gradient(135deg, ${post.color}, ${post.color}dd); font-family: 'Segoe UI', sans-serif; }
  .card { text-align:center; color:white; padding:60px; }
  .emoji { font-size:80px; margin-bottom:32px; }
  .subtitle { font-size:24px; opacity:0.8; margin-bottom:16px; letter-spacing:2px; text-transform:uppercase; }
  .title { font-size:56px; font-weight:800; line-height:1.3; white-space:pre-line; }
  .brand { position:absolute; bottom:48px; font-size:22px; color:rgba(255,255,255,0.7); font-weight:600; }
</style></head><body>
  <div class="card">
    <div class="emoji">${post.emoji}</div>
    <div class="subtitle">${post.subtitle}</div>
    <div class="title">${post.title}</div>
  </div>
  <div class="brand">찰칵AI</div>
</body></html>`;
}

function textHTML(post, slide) {
  const items = slide.bullets
    .map((b) => b === '' ? '<li style="list-style:none;height:12px"></li>' : `<li>${b}</li>`)
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${SIZE}px; height:${SIZE}px; display:flex; align-items:center; justify-content:center;
    background:#ffffff; font-family:'Segoe UI',sans-serif; }
  .card { padding:80px; width:100%; }
  .heading { font-size:42px; font-weight:800; color:${post.color}; margin-bottom:40px; }
  .accent { width:60px; height:5px; background:${post.color}; border-radius:3px; margin-bottom:40px; }
  ul { list-style:none; }
  li { font-size:28px; color:#374151; line-height:1.7; padding-left:0; }
  .brand { position:absolute; bottom:40px; right:48px; font-size:20px; color:#9CA3AF; font-weight:600; }
</style></head><body>
  <div class="card">
    <div class="accent"></div>
    <div class="heading">${slide.heading}</div>
    <ul>${items}</ul>
  </div>
  <div class="brand">찰칵AI</div>
</body></html>`;
}

function ctaHTML(post, slide) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${SIZE}px; height:${SIZE}px; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg, ${post.color}, ${post.color}cc); font-family:'Segoe UI',sans-serif; }
  .card { text-align:center; color:white; padding:80px; }
  .emoji { font-size:100px; margin-bottom:40px; }
  .text { font-size:48px; font-weight:800; line-height:1.4; white-space:pre-line; }
  .arrow { margin-top:40px; font-size:36px; opacity:0.7; }
  .brand { position:absolute; bottom:48px; font-size:22px; color:rgba(255,255,255,0.7); font-weight:600; }
</style></head><body>
  <div class="card">
    <div class="emoji">${slide.emoji}</div>
    <div class="text">${slide.text}</div>
    <div class="arrow">→ 프로필 링크</div>
  </div>
  <div class="brand">찰칵AI</div>
</body></html>`;
}

// ── Screenshot slide: crop to 1:1 ───────────────────
function screenshotHTML(slide, imgBase64) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${SIZE}px; height:${SIZE}px; background:#f8fafc; font-family:'Segoe UI',sans-serif;
    display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .phone { width:380px; height:780px; border-radius:40px; overflow:hidden;
    box-shadow: 0 25px 60px rgba(0,0,0,0.15); border:8px solid #1f2937; background:#fff; position:relative; }
  .phone img { width:100%; height:100%; object-fit:cover; object-position:top; }
  .notch { position:absolute; top:0; left:50%; transform:translateX(-50%);
    width:120px; height:28px; background:#1f2937; border-radius:0 0 16px 16px; z-index:2; }
  .label { margin-top:24px; font-size:22px; color:#6B7280; font-weight:500; }
</style></head><body>
  <div class="phone">
    <div class="notch"></div>
    <img src="data:image/png;base64,${imgBase64}" />
  </div>
  <div class="label">${slide.label || ''}</div>
</body></html>`;
}

function screenshotWideHTML(slide, imgBase64) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${SIZE}px; height:${SIZE}px; background:#f8fafc; font-family:'Segoe UI',sans-serif;
    display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .browser { width:960px; border-radius:12px; overflow:hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.12); border:2px solid #e5e7eb; background:#fff; }
  .toolbar { height:36px; background:#f3f4f6; display:flex; align-items:center; padding:0 14px; gap:7px; }
  .dot { width:11px; height:11px; border-radius:50%; }
  .dot-r { background:#ef4444; } .dot-y { background:#f59e0b; } .dot-g { background:#22c55e; }
  .content { width:100%; }
  .content img { width:100%; display:block; }
  .label { margin-top:20px; font-size:22px; color:#6B7280; font-weight:500; }
</style></head><body>
  <div class="browser">
    <div class="toolbar">
      <div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div>
    </div>
    <div class="content"><img src="data:image/png;base64,${imgBase64}" /></div>
  </div>
  <div class="label">${slide.label || ''}</div>
</body></html>`;
}

// ── Main ─────────────────────────────────────────────
async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  for (const post of posts) {
    const postDir = path.join(OUT, `post-${post.id}`);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

    console.log(`\n📱 Post ${post.id}: ${post.title.replace(/\n/g, ' ')}`);

    for (let i = 0; i < post.slides.length; i++) {
      const slide = post.slides[i];
      const slideNum = i + 1;
      let html = '';

      if (slide.type === 'cover') {
        html = coverHTML(post);
      } else if (slide.type === 'text') {
        html = textHTML(post, slide);
      } else if (slide.type === 'cta') {
        html = ctaHTML(post, slide);
      } else if (slide.type === 'screenshot') {
        const imgPath = path.join(SHOTS, slide.file);
        if (!fs.existsSync(imgPath)) {
          console.log(`  ⚠️  Missing: ${slide.file}, skipping`);
          continue;
        }
        const imgBase64 = fs.readFileSync(imgPath).toString('base64');
        // Decide phone vs browser mockup based on filename
        const isDesktop = slide.file.includes('desktop') || slide.file.includes('coming-soon');
        html = isDesktop ? screenshotWideHTML(slide, imgBase64) : screenshotHTML(slide, imgBase64);
      }

      const page = await browser.newPage();
      await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 500));

      const outFile = path.join(postDir, `slide-${slideNum}.png`);
      await page.screenshot({ path: outFile, type: 'png', clip: { x: 0, y: 0, width: SIZE, height: SIZE } });
      console.log(`  ✅ slide-${slideNum}.png (${slide.type})`);
      await page.close();
    }

    // Copy caption
    const captionSrc = path.join(OUT, `${post.id}-caption.md`);
    const captionDst = path.join(postDir, 'caption.md');
    if (fs.existsSync(captionSrc)) {
      fs.copyFileSync(captionSrc, captionDst);
      console.log(`  📝 caption.md copied`);
    }
  }

  await browser.close();
  console.log('\n🎉 All 10 Instagram posts generated!');
}

main().catch(console.error);
