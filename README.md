# 찰칵AI — 나만의 AI 사진작가

한국인 특화 AI 사진 서비스. 셀카 5장으로 증명사진·카카오·인스타 프로필을 생성합니다.

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **PWA**: next-pwa (서비스 워커, 홈 화면 추가, 푸시 알림)
- **Auth/DB**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Astria.ai (모델 학습 + 이미지 생성)
- **결제**: 토스페이먼츠 (1회 + 정기결제)
- **이메일**: Resend
- **배포**: Vercel (서울 리전)

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 실제 키 입력

# 3. 개발 서버
npm run dev
```

## 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 타입 체크 |

## PWA 설정

### 매니페스트
`public/manifest.json` — standalone 모드, 테마 #2563EB

### 서비스 워커
`next-pwa`가 빌드 시 자동 생성 (`public/sw.js`)
- 개발 모드에서는 비활성화 (`disable: process.env.NODE_ENV === 'development'`)

### VAPID 키 생성
```bash
npx web-push generate-vapid-keys
```
생성된 키를 `.env.local`의 `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`에 입력

### 푸시 알림
- 사진 생성 완료 시 PWA 설치 사용자에게 푸시 발송
- `app/api/push/route.ts`에서 구독 관리

## Supabase 테이블

```sql
-- chalcak_ 접두사: 기존 Supabase 프로젝트와 공유하기 위한 네임스페이스

-- 사용자
create table chalcak_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

-- 결제
create table chalcak_payments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  amount integer not null,
  plan_type text not null,
  status text not null default 'pending',
  payment_key text,
  order_id text,
  created_at timestamptz default now()
);

-- 구독
create table chalcak_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text unique not null,
  plan text not null,
  status text not null default 'active',
  billing_key text,
  next_billing_date timestamptz,
  monthly_credits integer default 0,
  used_credits integer default 0
);

-- AI 생성
create table chalcak_generations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  tune_id integer not null,
  style text not null,
  image_urls text[] default '{}',
  created_at timestamptz default now()
);

-- Coming Soon 알림
create table chalcak_waiting_list (
  id uuid primary key default gen_random_uuid(),
  style_name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- 푸시 알림 구독
create table chalcak_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  endpoint text unique not null,
  subscription jsonb not null,
  created_at timestamptz default now()
);
```

## 배포

Vercel에 연결 후 환경변수를 설정하면 자동 배포됩니다.

```bash
vercel --prod
```

서울 리전(`icn1`)으로 배포됩니다 (`vercel.json` 설정).
