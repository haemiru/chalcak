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
// 자연스러운 보정 공통 요소 — "사진 잘 받는 날" 느낌
const NATURAL_ENHANCE =
  "clear healthy skin, well-groomed appearance, flattering soft lighting, natural subtle retouching, photogenic";
const NATURAL_NEGATIVE =
  "blemishes, dark circles, wrinkles, tired look, oily skin, uneven skin tone, harsh shadows on face, unflattering angle, distorted features, plastic surgery look, overly airbrushed, uncanny valley";

export const STYLE_PROMPTS: Record<
  string,
  { prompt: string; negative: string; numImages: number }
> = {
  "id-photo": {
    prompt:
      `Professional Korean ID photo of TOK, formal white background, passport photo style, composed calm expression, front-facing, soft studio lighting, sharp focus, high resolution, wearing dark formal suit, ${NATURAL_ENHANCE}`,
    negative:
      `blurry, low quality, cartoon, illustration, sunglasses, hat, mask, side angle, ${NATURAL_NEGATIVE}`,
    numImages: 4,
  },
  suit: {
    prompt:
      `Professional business portrait of TOK, wearing elegant dark navy suit with crisp white shirt, corporate headshot, soft diffused studio lighting, gentle bokeh background, approachable confident expression, slight natural smile, ${NATURAL_ENHANCE}, high resolution`,
    negative:
      `blurry, low quality, cartoon, casual clothes, sunglasses, hat, ${NATURAL_NEGATIVE}`,
    numImages: 4,
  },
  kakao: {
    prompt:
      `Natural casual portrait of TOK, warm golden hour window lighting, gentle genuine smile, soft clean minimal background, Korean style profile photo, warm flattering color tone, relaxed comfortable expression, ${NATURAL_ENHANCE}`,
    negative:
      `blurry, low quality, overly filtered, heavy makeup, ${NATURAL_NEGATIVE}`,
    numImages: 4,
  },
  instagram: {
    prompt:
      `Aesthetic Instagram portrait of TOK, cinematic golden hour lighting, beautiful creamy bokeh, stylish and trendy, rich warm colors, magazine editorial quality, natural confident pose, ${NATURAL_ENHANCE}`,
    negative:
      `blurry, low quality, dull colors, harsh lighting, ${NATURAL_NEGATIVE}`,
    numImages: 4,
  },
};

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
          steps: 1200,
          lora_rank: 16,
          autocaption: true,
          autocaption_prefix: `a photo of ${params.triggerWord}, `,
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
        num_inference_steps: 28,
        guidance_scale: 3.5,
        lora_scale: 0.8,
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
