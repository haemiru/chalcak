export const PLANS = {
  trial: { price: 2900, credits: 5, label: "체험", type: "one-time" },
  basic: { price: 4900, credits: 10, label: "베이직", type: "subscription" },
  pro: { price: 9900, credits: 100, label: "프로", type: "subscription" },
  premium: { price: 29000, credits: 1000, label: "프리미엄", type: "subscription" },
} as const;

export type PlanKey = keyof typeof PLANS;

export const ACTIVE_STYLES = [
  {
    id: "id-photo",
    name: "증명사진",
    emoji: "📷",
    desc: "취업·여권·이력서용 정장 증명사진",
  },
  {
    id: "suit",
    name: "정장 프로필",
    emoji: "👔",
    desc: "비즈니스 프로필 & 링크드인",
  },
  {
    id: "kakao",
    name: "카카오톡 프로필",
    emoji: "💬",
    desc: "자연스러운 카카오톡 프로필 사진",
  },
  {
    id: "instagram",
    name: "인스타 프로필",
    emoji: "📸",
    desc: "감성적인 인스타그램 프로필",
  },
] as const;

export const COMING_SOON_STYLES = [
  { id: "wedding", name: "웨딩 화보", emoji: "💒" },
  { id: "season", name: "시즌 컨셉", emoji: "🌸" },
  { id: "shopping-model", name: "쇼핑몰 모델", emoji: "🛍️" },
  { id: "youtube", name: "유튜브 썸네일", emoji: "🎬" },
  { id: "ai-video", name: "AI 영상", emoji: "🎥" },
  { id: "avatar", name: "3D 아바타", emoji: "🧑‍💻" },
] as const;

// Supabase 테이블명 — 기존 프로젝트와 공유하므로 접두사 사용
export const DB = {
  users: "chalcak_users",
  payments: "chalcak_payments",
  subscriptions: "chalcak_subscriptions",
  generations: "chalcak_generations",
  waitingList: "chalcak_waiting_list",
  pushSubscriptions: "chalcak_push_subscriptions",
} as const;

export const FAQ_ITEMS = [
  {
    q: "사진 규격은 어떻게 되나요?",
    a: "증명사진은 3×4cm 300dpi로 자동 크롭됩니다. 여권, 이력서, 주민등록증 등 한국 표준 규격을 모두 지원합니다.",
  },
  {
    q: "생성에 얼마나 걸리나요?",
    a: "AI 모델 학습에 약 10~15분, 이후 사진 1장 생성에 약 30초가 소요됩니다.",
  },
  {
    q: "한국인 얼굴에 최적화되어 있나요?",
    a: "네, 한국인 얼굴 특징에 맞춰 학습된 모델을 사용합니다. 피부톤, 얼굴형, 헤어스타일 등을 자연스럽게 처리합니다.",
  },
  {
    q: "환불이 가능한가요?",
    a: "결제 후 AI 학습 시작 전이라면 전액 환불 가능합니다. 학습 시작 후에는 크레딧으로 전환됩니다.",
  },
] as const;
