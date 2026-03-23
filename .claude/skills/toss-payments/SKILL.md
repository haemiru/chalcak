---
name: toss-payments
description: 토스페이먼츠 결제 연동 구현 시 사용. "토스페이먼츠", "결제", "구독", "정기결제", "빌링키", "결제 취소", "환불" 관련 작업 시 자동 적용.
allowed-tools: [Read, Write, Bash]
---

# 토스페이먼츠 연동 가이드

## 환경변수
```
TOSS_CLIENT_KEY=test_ck_...   # 클라이언트 키 (공개)
TOSS_SECRET_KEY=test_sk_...   # 시크릿 키 (서버 전용, 절대 클라이언트 노출 금지)
```

## 플랜 상수
```typescript
export const PLANS = {
  trial:   { price: 2900,  credits: 5,    label: '체험', type: 'one-time' },
  basic:   { price: 4900,  credits: 10,   label: '베이직', type: 'subscription' },
  pro:     { price: 9900,  credits: 100,  label: '프로', type: 'subscription' },
  premium: { price: 29000, credits: 1000, label: '프리미엄', type: 'subscription' },
}
```

## 1회성 결제 (체험 플랜)
```typescript
// 클라이언트: app/payment/page.tsx
import { loadTossPayments } from '@tosspayments/payment-sdk'

const handlePayment = async () => {
  const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
  await tossPayments.requestPayment('카드', {
    amount: 2900,
    orderId: `order_${Date.now()}`,
    orderName: '찰칵AI 체험권',
    successUrl: `${window.location.origin}/api/payment/confirm`,
    failUrl: `${window.location.origin}/payment/fail`,
  })
}
```

## 결제 승인 API (서버)
```typescript
// app/api/payment/confirm/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
  })

  const payment = await response.json()
  if (!response.ok) throw new Error(payment.message)

  // DB 저장 후 /generate로 리다이렉트
  await savePaymentToDb(payment)
  return NextResponse.redirect(new URL('/generate', req.url))
}
```

## 정기결제 빌링키 발급
```typescript
// 빌링키 발급 요청 (클라이언트)
await tossPayments.requestBillingAuth('카드', {
  customerKey: userId,
  successUrl: `${window.location.origin}/api/subscription/confirm`,
  failUrl: `${window.location.origin}/payment/fail`,
})

// 빌링키 확인 + 첫 결제 (서버)
// app/api/subscription/confirm/route.ts
const billing = await fetch(`https://api.tosspayments.com/v1/billing/authorizations/${authKey}`, {
  method: 'POST',
  headers: { 'Authorization': `Basic ${encodedKey}` },
  body: JSON.stringify({ customerKey: userId }),
}).then(r => r.json())

// 빌링키로 즉시 첫 달 결제
const payment = await fetch(`https://api.tosspayments.com/v1/billing/${billing.billingKey}`, {
  method: 'POST',
  headers: { 'Authorization': `Basic ${encodedKey}` },
  body: JSON.stringify({
    customerKey: userId,
    amount: planPrice,
    orderId: `sub_${Date.now()}`,
    orderName: `찰칵AI ${planLabel} 구독`,
  }),
}).then(r => r.json())
```

## 결제 취소 (환불)
```typescript
const cancelPayment = async (paymentKey: string, reason: string) => {
  return fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancelReason: reason }),
  })
}
```

## Webhook 처리
```typescript
// app/api/payment/webhook/route.ts
// IMPORTANT: 웹훅 시크릿 검증 필수
export async function POST(req: Request) {
  const secret = req.headers.get('toss-signature')
  // 시그니처 검증 로직 추가
  const event = await req.json()

  switch (event.eventType) {
    case 'PAYMENT_STATUS_CHANGED':
      await handlePaymentStatus(event.data)
      break
    case 'BILLING_KEY_STATUS_CHANGED':
      await handleBillingKeyStatus(event.data)
      break
  }
  return new Response('OK')
}
```

## 주의사항
- `TOSS_SECRET_KEY`는 절대 클라이언트 코드에 노출 금지
- 결제 금액은 반드시 서버에서 플랜 상수와 대조 검증 (클라이언트 금액 신뢰 금지)
- AI 모델 학습 실패 시 자동 환불 처리 로직 필수
- 정기결제 실패 시 3일 후 재시도, 재시도 실패 시 구독 일시정지
