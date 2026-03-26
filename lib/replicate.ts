const REPLICATE_API_URL = "https://api.replicate.com/v1";

// Flux LoRA trainer version
const FLUX_LORA_TRAINER_VERSION =
  "26dce37af90b9d997eeb970d92e47de3064d46c300504ae376c75bef6a9022d2";

function getApiToken(): string {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not configured");
  return token;
}

function getUsername(): string {
  const username = process.env.REPLICATE_USERNAME;
  if (!username) throw new Error("REPLICATE_USERNAME is not configured");
  return username;
}

function authHeaders(contentType = "application/json") {
  return {
    Authorization: `Bearer ${getApiToken()}`,
    "Content-Type": contentType,
  };
}

// -- Style prompts (trigger word: TOK) --
// 자연스러운 보정 — "사진 잘 받는 날" 느낌, 성별별 디테일
const ENHANCE_FEMALE =
  "clear radiant skin, soft feminine features, natural light makeup look, well-groomed eyebrows, flattering soft lighting, subtle skin smoothing, photogenic, youthful glow";
const ENHANCE_MALE =
  "clear healthy skin, clean-shaven or well-groomed facial hair, sharp jawline, flattering soft lighting, natural subtle retouching, photogenic, well-groomed appearance";
const NATURAL_NEGATIVE =
  "blemishes, dark circles, wrinkles, tired look, oily skin, uneven skin tone, harsh shadows on face, unflattering angle, distorted features, plastic surgery look, overly airbrushed, uncanny valley, different person, changed face shape";

type GenderType = "female" | "male";

function genderWord(gender: GenderType): string {
  return gender === "female" ? "Korean woman" : "Korean man";
}

function enhance(gender: GenderType): string {
  return gender === "female" ? ENHANCE_FEMALE : ENHANCE_MALE;
}

function dressCode(gender: GenderType, style: string): string {
  if (style === "id-photo" || style === "suit") {
    return gender === "female"
      ? "wearing elegant dark blazer with white blouse"
      : "wearing dark formal suit with crisp white shirt";
  }
  return "";
}

export function buildStylePrompt(
  style: string,
  gender: GenderType
): { prompt: string; negative: string; numImages: number } {
  const subject = `${genderWord(gender)} TOK`;
  const enh = enhance(gender);
  const dress = dressCode(gender, style);

  const prompts: Record<string, { prompt: string; negative: string; numImages: number }> = {
    "id-photo": {
      prompt:
        `Professional Korean ID photo of ${subject}, ${dress}, formal white background, passport photo style, composed calm expression, front-facing, soft studio lighting, sharp focus, high resolution, ${enh}`,
      negative:
        `blurry, low quality, cartoon, illustration, sunglasses, hat, mask, side angle, ${NATURAL_NEGATIVE}`,
      numImages: 4,
    },
    suit: {
      prompt:
        `Professional business portrait of ${subject}, ${dress}, corporate headshot, soft diffused studio lighting, gentle bokeh background, approachable confident expression, slight natural smile, ${enh}, high resolution`,
      negative:
        `blurry, low quality, cartoon, casual clothes, sunglasses, hat, ${NATURAL_NEGATIVE}`,
      numImages: 4,
    },
    kakao: {
      prompt:
        `Natural casual portrait of ${subject}, warm golden hour window lighting, gentle genuine smile, soft clean minimal background, Korean style profile photo, warm flattering color tone, relaxed comfortable expression, ${enh}`,
      negative:
        `blurry, low quality, overly filtered, heavy makeup, ${NATURAL_NEGATIVE}`,
      numImages: 4,
    },
    instagram: {
      prompt:
        `Aesthetic Instagram portrait of ${subject}, cinematic golden hour lighting, beautiful creamy bokeh, stylish and trendy, rich warm colors, magazine editorial quality, natural confident pose, ${enh}`,
      negative:
        `blurry, low quality, dull colors, harsh lighting, ${NATURAL_NEGATIVE}`,
      numImages: 4,
    },
  };

  return prompts[style] ?? prompts["kakao"];
}

// Legacy compat — used by webhook (reads gender from DB)
export const STYLE_PROMPTS = new Proxy(
  {} as Record<string, { prompt: string; negative: string; numImages: number }>,
  {
    get(_target, prop: string) {
      // Default to female when accessed without gender context (webhook will use buildStylePrompt)
      return buildStylePrompt(prop, "female");
    },
  }
);

// -- Upload training data (images → zip → Replicate files API) --

export async function uploadTrainingData(
  imageUrls: string[]
): Promise<string> {
  // Dynamic import for Node-only modules
  const JSZip = (await import("jszip")).default;

  const zip = new JSZip();

  // Download each image and add to zip
  for (let i = 0; i < imageUrls.length; i++) {
    const res = await fetch(imageUrls[i]);
    if (!res.ok) {
      throw new Error(`Failed to download image ${i}: ${res.statusText}`);
    }
    const buffer = await res.arrayBuffer();

    // Determine extension from content-type, default to jpg
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    zip.file(`image_${i}.${ext}`, buffer);
  }

  const zipArrayBuffer = await zip.generateAsync({ type: "arraybuffer" });

  // Upload zip to Replicate files API
  const formData = new FormData();
  const blob = new Blob([zipArrayBuffer], { type: "application/zip" });
  formData.append("content", blob, "training_images.zip");

  const res = await fetch(`${REPLICATE_API_URL}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiToken()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Replicate file upload error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.urls.get; // The URL to access the uploaded file
}

// -- Create a model destination on Replicate --

export async function createModel(name: string): Promise<string> {
  const owner = getUsername();

  const res = await fetch(`${REPLICATE_API_URL}/models`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      owner,
      name,
      visibility: "private",
      hardware: "gpu-t4",
    }),
  });

  // 409 = model already exists, that's fine
  if (res.status === 409) {
    return `${owner}/${name}`;
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Replicate create model error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return `${data.owner}/${data.name}`;
}

// -- Start Flux LoRA training --

interface CreateTrainingParams {
  destination: string;
  imageDataUrl: string;
  triggerWord: string;
  gender: GenderType;
  webhookUrl?: string;
}

export interface TrainingResponse {
  id: string;
  status: string;
  output?: {
    version?: string;
    weights?: string;
  };
}

export async function createTraining(
  params: CreateTrainingParams
): Promise<TrainingResponse> {
  const res = await fetch(
    `${REPLICATE_API_URL}/models/ostris/flux-dev-lora-trainer/versions/${FLUX_LORA_TRAINER_VERSION}/trainings`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        destination: params.destination,
        input: {
          input_images: params.imageDataUrl,
          trigger_word: params.triggerWord,
          steps: 1500,
          lora_rank: 16,
          autocaption: true,
          autocaption_prefix: `a photo of ${params.triggerWord}, a ${genderWord(params.gender)}, `,
        },
        webhook: params.webhookUrl,
        webhook_events_filter: ["completed"],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Replicate training error (${res.status}): ${errorText}`);
  }

  return res.json();
}

// -- Get training status --

export async function getTrainingStatus(
  trainingId: string
): Promise<TrainingResponse> {
  const res = await fetch(`${REPLICATE_API_URL}/trainings/${trainingId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Replicate training status error (${res.status}): ${errorText}`
    );
  }

  return res.json();
}

// -- Create prediction (generate images) --

interface CreatePredictionParams {
  version: string;
  prompt: string;
  numOutputs?: number;
  webhookUrl?: string;
}

export interface PredictionResponse {
  id: string;
  status: string;
  output?: string[];
}

export async function createPrediction(
  params: CreatePredictionParams
): Promise<PredictionResponse> {
  const res = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      version: params.version,
      input: {
        prompt: params.prompt,
        num_outputs: params.numOutputs ?? 4,
        num_inference_steps: 30,
        guidance_scale: 3.5,
        lora_scale: 1.0,
        output_format: "png",
        output_quality: 95,
      },
      webhook: params.webhookUrl,
      webhook_events_filter: ["completed"],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Replicate prediction error (${res.status}): ${errorText}`
    );
  }

  return res.json();
}

// -- Get prediction status --

export async function getPredictionStatus(
  predictionId: string
): Promise<PredictionResponse> {
  const res = await fetch(
    `${REPLICATE_API_URL}/predictions/${predictionId}`,
    {
      headers: authHeaders(),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Replicate prediction status error (${res.status}): ${errorText}`
    );
  }

  return res.json();
}
