---
name: astria-photo-generation
description: Astria.ai API를 사용해 AI 사진 모델 학습(튜닝) 및 이미지 생성을 구현할 때 사용. "Astria", "AI 모델 학습", "사진 생성", "튜닝", "DreamBooth", "이미지 생성 API" 관련 작업 시 자동 적용.
allowed-tools: [Read, Write, Bash]
---

# Astria.ai API 연동 가이드

## API 기본 정보
- Base URL: `https://api.astria.ai`
- 인증: `Authorization: Bearer ${ASTRIA_API_KEY}`
- 환경변수: `ASTRIA_API_KEY`

## 핵심 플로우
```
1. 사용자 사진 업로드 (5~15장)
2. POST /tunes → 튜닝(개인화 모델) 생성 요청
3. 튜닝 완료 webhook 수신 (20~30분 소요)
4. POST /tunes/{tune_id}/prompts → 스타일별 이미지 생성
5. 생성된 이미지 URL → Supabase Storage 저장
```

## 튜닝 생성 API
```typescript
// POST https://api.astria.ai/tunes
const createTune = async (imageUrls: string[], title: string) => {
  const response = await fetch('https://api.astria.ai/tunes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ASTRIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tune: {
        title,
        name: 'person',  // 인물 사진용
        image_urls: imageUrls,
        callback: `${process.env.NEXT_PUBLIC_URL}/api/webhook/astria`,
      }
    })
  })
  return response.json()
}
```

## 이미지 생성 API
```typescript
// POST https://api.astria.ai/tunes/{tune_id}/prompts
const generateImages = async (tuneId: number, style: string) => {
  const prompt = STYLE_PROMPTS[style]
  const response = await fetch(`https://api.astria.ai/tunes/${tuneId}/prompts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ASTRIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: {
        text: prompt,
        num_images: 10,
        callback: `${process.env.NEXT_PUBLIC_URL}/api/webhook/astria-images`,
      }
    })
  })
  return response.json()
}
```

## 스타일별 프롬프트
```typescript
export const STYLE_PROMPTS: Record<string, string> = {
  'id-photo': 'ohwx person, professional ID photo, white background, front facing, formal attire, Korean passport photo style, sharp focus, high resolution',
  'suit': 'ohwx person, professional business headshot, wearing formal suit, clean background, corporate portrait, Korean professional style',
  'kakao': 'ohwx person, warm and friendly profile photo, natural lighting, soft background, genuine smile, casual Korean style',
  'instagram': 'ohwx person, trendy aesthetic profile photo, soft bokeh background, natural light, instagram portrait style, Korean beauty standard',
}
```

## Webhook 처리
```typescript
// app/api/webhook/astria/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const { tune } = body

  if (tune.trained_at) {
    // 튜닝 완료 → DB 업데이트 + 이메일 발송
    await supabase.from('generations')
      .update({ tune_status: 'ready', tune_id: tune.id })
      .eq('tune_id', tune.id)

    await sendCompletionEmail(tune.id)
  }
}
```

## 에러 처리
- API 실패 시 → Replicate.com 백업 API로 자동 전환
- 튜닝 실패 시 → 자동 환불 처리 (토스페이먼츠 취소 API 호출)
- 이미지 생성 실패 시 → 재시도 1회 후 실패 시 크레딧 반환

## 주의사항
- `ohwx person` 토큰을 프롬프트 앞에 반드시 포함 (Astria 튜닝 모델 식별자)
- 튜닝 완료까지 20~30분 소요 → 폴링 또는 webhook으로 처리
- 원본 사진은 튜닝 완료 후 즉시 삭제 (개인정보 보호)
