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
export const STYLE_PROMPTS: Record<
  string,
  { prompt: string; negative: string; numImages: number }
> = {
  "id-photo": {
    prompt:
      "Professional Korean ID photo of TOK, formal white background, passport photo style, neutral expression, front-facing, studio lighting, sharp focus, high resolution, wearing dark formal suit",
    negative:
      "blurry, low quality, cartoon, illustration, sunglasses, hat, mask, side angle",
    numImages: 4,
  },
  suit: {
    prompt:
      "Professional business portrait of TOK, wearing elegant dark suit, corporate headshot, LinkedIn profile photo, studio lighting, bokeh background, confident expression, high resolution",
    negative:
      "blurry, low quality, cartoon, casual clothes, sunglasses, hat",
    numImages: 4,
  },
  kakao: {
    prompt:
      "Natural casual portrait of TOK, warm lighting, soft smile, clean background, Korean style profile photo, gentle color tone, slightly candid look, high quality",
    negative:
      "blurry, low quality, overly filtered, heavy makeup, studio feel",
    numImages: 4,
  },
  instagram: {
    prompt:
      "Aesthetic Instagram portrait of TOK, cinematic lighting, golden hour, beautiful bokeh, trendy and stylish, vibrant colors, magazine quality, Korean beauty aesthetic",
    negative:
      "blurry, low quality, dull colors, harsh lighting, unflattering angle",
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
          steps: 1000,
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
