const ASTRIA_API_URL = "https://api.astria.ai";

function getApiKey(): string {
  const key = process.env.ASTRIA_API_KEY;
  if (!key) throw new Error("ASTRIA_API_KEY is not configured");
  return key;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

// ── 스타일별 프롬프트 ──
export const STYLE_PROMPTS: Record<string, { prompt: string; negative: string; numImages: number }> = {
  "id-photo": {
    prompt:
      "Professional Korean ID photo of sks person, formal white background, passport photo style, neutral expression, front-facing, studio lighting, sharp focus, high resolution, wearing dark formal suit",
    negative:
      "blurry, low quality, cartoon, illustration, sunglasses, hat, mask, side angle",
    numImages: 4,
  },
  suit: {
    prompt:
      "Professional business portrait of sks person, wearing elegant dark suit, corporate headshot, LinkedIn profile photo, studio lighting, bokeh background, confident expression, high resolution",
    negative:
      "blurry, low quality, cartoon, casual clothes, sunglasses, hat",
    numImages: 4,
  },
  kakao: {
    prompt:
      "Natural casual portrait of sks person, warm lighting, soft smile, clean background, Korean style profile photo, gentle color tone, slightly candid look, high quality",
    negative:
      "blurry, low quality, overly filtered, heavy makeup, studio feel",
    numImages: 4,
  },
  instagram: {
    prompt:
      "Aesthetic Instagram portrait of sks person, cinematic lighting, golden hour, beautiful bokeh, trendy and stylish, vibrant colors, magazine quality, Korean beauty aesthetic",
    negative:
      "blurry, low quality, dull colors, harsh lighting, unflattering angle",
    numImages: 4,
  },
};

// ── Tune (모델 학습) ──
interface CreateTuneParams {
  title: string;
  imageUrls: string[];
  className?: string;
  callbackUrl?: string;
}

export interface TuneResponse {
  id: number;
  title: string;
  status: string;
}

export async function createTune(params: CreateTuneParams): Promise<TuneResponse> {
  const body = {
    tune: {
      title: params.title,
      name: params.className ?? "person",
      image_urls: params.imageUrls,
      callback: params.callbackUrl,
    },
  };

  const res = await fetch(`${ASTRIA_API_URL}/tunes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Astria tune error (${res.status}): ${errorText}`);
  }

  return res.json();
}

// ── Tune 상태 조회 ──
export async function getTuneStatus(tuneId: number): Promise<TuneResponse> {
  const res = await fetch(`${ASTRIA_API_URL}/tunes/${tuneId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Astria status error (${res.status}): ${errorText}`);
  }

  return res.json();
}

// ── 이미지 생성 (Prompt) ──
interface GenerateParams {
  tuneId: number;
  prompt: string;
  negativePrompt?: string;
  numImages?: number;
  callbackUrl?: string;
}

export interface PromptResponse {
  id: number;
  status: string;
  images?: string[];
}

export async function generateImages(params: GenerateParams): Promise<PromptResponse> {
  const body = {
    prompt: {
      text: params.prompt,
      negative_prompt: params.negativePrompt ?? "",
      num_images: params.numImages ?? 4,
      callback: params.callbackUrl,
    },
  };

  const res = await fetch(`${ASTRIA_API_URL}/tunes/${params.tuneId}/prompts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Astria generate error (${res.status}): ${errorText}`);
  }

  return res.json();
}

// ── 프롬프트 결과 조회 ──
export async function getPromptResult(tuneId: number, promptId: number): Promise<PromptResponse> {
  const res = await fetch(`${ASTRIA_API_URL}/tunes/${tuneId}/prompts/${promptId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Astria prompt status error (${res.status}): ${errorText}`);
  }

  return res.json();
}
