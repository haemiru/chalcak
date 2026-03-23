---
name: korean-ui
description: 찰칵AI의 한국어 UI 컴포넌트 및 한국 사용자 경험 구현 시 사용. "한국어", "UI 컴포넌트", "랜딩페이지", "스타일 선택", "Coming Soon", "카카오 로그인", "증명사진 크롭" 관련 작업 시 자동 적용.
allowed-tools: [Read, Write, Bash]
---

# 찰칵AI 한국어 UI 가이드

## 디자인 원칙
- 색상: 메인 `#2563EB` (파란색), 배경 흰색, 텍스트 `#111827`
- 폰트: Noto Sans KR (한국어 최적화)
- 톤: 신뢰감 있고 깔끔한 한국 스타트업 스타일
- 버튼: 둥근 모서리(rounded-lg), 호버 효과 필수

## 스타일 선택 카드 컴포넌트
```tsx
// 작동 스타일 카드
interface StyleCardProps {
  id: string
  title: string
  description: string
  emoji: string
  isSelected: boolean
  onClick: () => void
}

const StyleCard = ({ id, title, description, emoji, isSelected, onClick }: StyleCardProps) => (
  <button
    onClick={onClick}
    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
      isSelected
        ? 'border-blue-600 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300'
    }`}
  >
    <span className="text-2xl mb-2 block">{emoji}</span>
    <p className="font-semibold text-sm">{title}</p>
    <p className="text-xs text-gray-500 mt-1">{description}</p>
  </button>
)

// Coming Soon 카드 (클릭 시 이메일 수집 모달)
const ComingSoonCard = ({ title, emoji, onNotify }: {
  title: string; emoji: string; onNotify: () => void
}) => (
  <button
    onClick={onNotify}
    className="relative p-4 rounded-xl border-2 border-gray-200 text-left opacity-50 hover:opacity-60 transition-opacity"
  >
    <div className="absolute top-2 right-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
      준비중
    </div>
    <span className="text-2xl mb-2 block">{emoji}</span>
    <p className="font-semibold text-sm text-gray-400">{title}</p>
  </button>
)
```

## Coming Soon 이메일 수집 모달
```tsx
const NotifyModal = ({ styleName, onClose }: { styleName: string; onClose: () => void }) => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    await fetch('/api/waiting-list', {
      method: 'POST',
      body: JSON.stringify({ style_name: styleName, email }),
    })
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full">
        {!submitted ? (
          <>
            <h3 className="font-bold text-lg mb-2">곧 출시 예정이에요! 🎉</h3>
            <p className="text-gray-500 text-sm mb-4">
              <strong>{styleName}</strong> 기능이 출시되면 가장 먼저 알려드릴게요.
            </p>
            <input
              type="email"
              placeholder="이메일 주소를 입력해주세요"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            />
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold"
            >
              출시 알림 받기
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold">등록 완료!</p>
            <p className="text-sm text-gray-500 mt-1">출시되면 바로 알려드릴게요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

## 증명사진 자동 크롭 (Sharp)
```typescript
// lib/image-processing.ts
import sharp from 'sharp'

export const cropIdPhoto = async (inputBuffer: Buffer): Promise<Buffer> => {
  // 증명사진 규격: 3x4cm = 354x472px (300dpi 기준)
  return sharp(inputBuffer)
    .resize(354, 472, {
      fit: 'cover',
      position: 'top',  // 얼굴이 상단에 위치하도록
    })
    .jpeg({ quality: 95 })
    .toBuffer()
}
```

## 카카오 소셜 로그인 (Supabase Auth)
```typescript
// components/KakaoLoginButton.tsx
const handleKakaoLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })
  if (error) console.error('카카오 로그인 실패:', error)
}
```

## 한국어 플랜 표시 컴포넌트
```tsx
const PlanBadge = ({ plan }: { plan: string }) => {
  const labels = { trial: '체험', basic: '베이직', pro: '프로', premium: '프리미엄' }
  const colors = {
    trial: 'bg-gray-100 text-gray-600',
    basic: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
    premium: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors[plan]}`}>
      {labels[plan]}
    </span>
  )
}
```

## 사진 업로드 UI (드래그앤드롭)
```tsx
// 최소 5장, 최대 15장 제한
// 얼굴이 잘 보이는지 미리보기
// 파일 크기 10MB 이하 검증
// 지원 형식: JPG, PNG, HEIC
const UPLOAD_RULES = {
  minFiles: 5,
  maxFiles: 15,
  maxSizeMB: 10,
  accepts: ['image/jpeg', 'image/png', 'image/heic'],
  guidance: [
    '얼굴이 잘 보이는 사진',
    '다양한 각도로 촬영',
    '밝은 조명에서 촬영',
    '안경 착용/미착용 모두 포함',
  ]
}
```

## 에러 메시지 (한국어)
```typescript
export const ERROR_MESSAGES = {
  upload_too_few: '사진을 최소 5장 이상 업로드해주세요.',
  upload_too_many: '사진은 최대 15장까지 업로드 가능합니다.',
  upload_file_size: '파일 크기는 10MB 이하여야 합니다.',
  payment_failed: '결제에 실패했습니다. 다시 시도해주세요.',
  generation_failed: '사진 생성에 실패했습니다. 크레딧을 반환해드립니다.',
  no_credits: '이번 달 생성 횟수를 모두 사용했습니다. 플랜을 업그레이드하시겠어요?',
}
```
