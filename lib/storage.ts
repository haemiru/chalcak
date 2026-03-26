import { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "generated-photos";

/**
 * Download images from external URLs (Replicate/Astria) and persist them
 * in Supabase Storage so they never expire.
 *
 * Returns an array of public URLs from Supabase Storage.
 * If any single image fails, its original URL is kept as fallback.
 */
export async function persistImages(
  db: SupabaseClient,
  userId: string,
  tuneId: string | number,
  images: string[]
): Promise<string[]> {
  const results = await Promise.all(
    images.map(async (url, i) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const contentType = res.headers.get("content-type") ?? "image/png";
        const ext = contentType.includes("webp")
          ? "webp"
          : contentType.includes("jpeg") || contentType.includes("jpg")
            ? "jpg"
            : "png";

        const buffer = Buffer.from(await res.arrayBuffer());
        const path = `${userId}/${tuneId}/${i}.${ext}`;

        const { error } = await db.storage
          .from(BUCKET)
          .upload(path, buffer, {
            contentType,
            upsert: true,
          });

        if (error) throw error;

        const { data: publicUrl } = db.storage
          .from(BUCKET)
          .getPublicUrl(path);

        return publicUrl.publicUrl;
      } catch (err) {
        console.error(`Failed to persist image ${i} for tune ${tuneId}:`, err);
        return url; // fallback to original URL
      }
    })
  );

  return results;
}
