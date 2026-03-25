# 찰칵AI — Claude Code 프로젝트 가이드

## 프로젝트 개요
한국인 특화 AI 사진 서비스. 셀카 5장으로 나만의 AI 모델을 만들고
취업 증명사진·카카오톡·인스타 프로필을 월 구독으로 제공한다.
**모바일 퍼스트 + PWA** — 핸드폰에서 앱처럼 사용 가능하도록 설계.

## 기술 스택
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Shadcn/UI
- **PWA**: next-pwa (서비스 워커, 홈 화면 추가, 오프라인 지원)
- **Backend**: Next.js API Routes (app/api/)
- **DB/Auth**: Supabase (PostgreSQL + Auth + Storage)
- **AI API**: Astria.ai (주), Replicate.com (백업)
- **결제**: 토스페이먼츠 (건당 + 정기결제 빌링키)
- **이메일**: Resend
- **배포**: Vercel

## 디렉토리 구조
```
찰칵AI/
├── public/
│   ├── manifest.json       # PWA 매니페스트
│   ├── icon-192x192.png    # PWA 아이콘
│   └── icon-512x512.png    # PWA 아이콘
├── app/
│   ├── page.tsx            # 랜딩페이지
│   ├── upload/             # 사진 업로드
│   ├── style/              # 스타일 선택
│   ├── payment/            # 결제
│   ├── generate/           # AI 생성 대기
│   ├── result/             # 결과 다운로드
│   ├── dashboard/          # 사용자 대시보드
│   ├── admin/              # 관리자
│   └── api/
│       ├── create-model/   # Astria.ai 튜닝 요청
│       ├── generate/       # 이미지 생성
│       ├── payment/        # 토스페이먼츠
│       └── subscription/   # 구독 관리
├── components/
├── lib/
│   ├── supabase.ts
│   ├── astria.ts
│   └── toss.ts
└── .claude/
    └── skills/
```

## 개발 명령어
```bash
npm run dev        # 개발 서버 (localhost:3000)
npm run build      # 프로덕션 빌드
npm run typecheck  # 타입 체크 (변경 후 반드시 실행)
npm run lint       # ESLint
```

## 모바일 퍼스트 규칙
- 모든 UI는 모바일(375px) 기준으로 먼저 설계, 데스크탑은 그 다음
- Tailwind 클래스 순서: 모바일 기본 → md: → lg:
- 터치 타겟 최소 44x44px (버튼, 링크 등)
- 사진 업로드: 최소 8장, 최대 15장, 12장 이상 권장. 모바일 카메라 롤 직접 접근 (accept="image/*", capture 속성)
- 하단 고정 CTA 버튼 (모바일에서 엄지 손가락 닿는 위치)
- 폰트 최소 16px (모바일 자동 확대 방지)

## PWA 설정
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

// public/manifest.json
{
  "name": "찰칵AI",
  "short_name": "찰칵AI",
  "description": "나만의 AI 사진작가",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563EB",
  "icons": [
    { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## 코딩 규칙
- 함수형 컴포넌트만 사용 (클래스 컴포넌트 금지)
- Server Component 우선, 클라이언트 상태 필요 시에만 'use client'
- Tailwind 유틸리티 우선 (커스텀 CSS 최소화)
- 모든 API Route는 에러 핸들링 필수 (try/catch + 적절한 HTTP 상태코드)
- 환경변수는 반드시 .env.local 사용, 하드코딩 절대 금지
- TypeScript strict mode — any 타입 사용 금지

## Supabase 테이블 구조
```
users            (id, email, name, created_at)
subscriptions    (id, user_id, plan, status, billing_key, next_billing_date, monthly_credits, used_credits)
payments         (id, user_id, amount, plan_type, status, created_at)
generations      (id, user_id, tune_id, image_urls, style, created_at)
waiting_list     (id, style_name, email, created_at)
```

## 결제 플랜 상수
```typescript
export const PLANS = {
  trial:   { price: 2900,  credits: 4,   label: '체험',     type: 'one-time',     tuneLimit: 1 },
  basic:   { price: 7900,  credits: 20,  label: '베이직',   type: 'subscription', tuneLimit: 1 },
  pro:     { price: 14900, credits: 52,  label: '프로',     type: 'subscription', tuneLimit: 2 },
  premium: { price: 39900, credits: 100, label: '프리미엄', type: 'subscription', tuneLimit: 3 },
} as const
```

## 스타일팩 상수
```typescript
export const ACTIVE_STYLES = ['id-photo', 'suit', 'kakao', 'instagram'] as const
export const COMING_SOON_STYLES = ['wedding', 'season', 'shopping-model', 'youtube', 'ai-video', 'avatar'] as const
```

## 중요 규칙 (MUST)
- **결제 완료 전에는 AI 모델 학습 시작 금지**
- **원본 사진은 생성 완료 후 Supabase Storage에서 즉시 삭제**
- **Coming Soon 스타일 클릭 시 실제 기능 실행 금지 — 이메일 수집 모달만 표시**
- **증명사진은 반드시 Sharp로 3x4cm 300dpi 자동 크롭 처리**
- **토스페이먼츠 webhook 검증 로직 반드시 포함**
- **모든 페이지 모바일 퍼스트 반응형 필수**

## 변경 후 검증 순서
1. `npm run typecheck` 통과 확인
2. `npm run lint` 통과 확인
3. 모바일(375px) 레이아웃 깨짐 없는지 확인
4. 결제 플로우: 체험(2,900원) → /generate 리다이렉트 확인
5. Coming Soon 클릭 → 이메일 수집 모달 동작 확인
6. PWA: manifest.json + 서비스 워커 정상 등록 확인
