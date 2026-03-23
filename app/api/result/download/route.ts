import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import JSZip from "jszip";

// ID photo spec: 3x4cm at 300dpi = 354x472px
const ID_PHOTO_WIDTH = 354;
const ID_PHOTO_HEIGHT = 472;

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function cropIdPhoto(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(ID_PHOTO_WIDTH, ID_PHOTO_HEIGHT, {
      fit: "cover",
      position: "top", // face is typically in upper portion
    })
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();
}

// Single image download (with optional id-photo crop)
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    const style = request.nextUrl.searchParams.get("style") ?? "";
    const mode = request.nextUrl.searchParams.get("mode"); // "zip" for batch

    if (mode === "zip") {
      return handleZipDownload(request);
    }

    if (!url) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    const raw = await fetchImage(url);
    const isIdPhoto = style === "id-photo";
    const processed = isIdPhoto ? await cropIdPhoto(raw) : raw;

    const filename = isIdPhoto
      ? "chalcak-id-photo-3x4cm-300dpi.png"
      : `chalcak-${style || "photo"}.png`;

    return new NextResponse(new Uint8Array(processed), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "다운로드에 실패했습니다." },
      { status: 500 }
    );
  }
}

// ZIP batch download
async function handleZipDownload(request: NextRequest) {
  const urlsParam = request.nextUrl.searchParams.get("urls");
  const style = request.nextUrl.searchParams.get("style") ?? "";

  if (!urlsParam) {
    return NextResponse.json(
      { error: "urls is required" },
      { status: 400 }
    );
  }

  const urls: string[] = JSON.parse(urlsParam);
  const isIdPhoto = style === "id-photo";
  const zip = new JSZip();

  await Promise.all(
    urls.map(async (url, i) => {
      const raw = await fetchImage(url);
      const processed = isIdPhoto ? await cropIdPhoto(raw) : raw;
      const name = isIdPhoto
        ? `증명사진_${i + 1}_3x4cm_300dpi.png`
        : `chalcak_${style}_${i + 1}.png`;
      zip.file(name, processed);
    })
  );

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="chalcak-${style || "photos"}.zip"`,
    },
  });
}
