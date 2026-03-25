/**
 * 클라이언트에서 이미지를 리사이즈하여 업로드 크기를 줄임
 * 모바일 사진(4000x3000, ~8MB) → 1024px(~200KB)
 */
const MAX_SIZE = 1024;
const QUALITY = 0.85;

export async function resizeImage(file: File): Promise<File> {
  // 이미 작은 파일은 리사이즈 불필요 (500KB 이하)
  if (file.size <= 500 * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // 긴 쪽을 MAX_SIZE로 축소
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const resized = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: file.lastModified,
          });
          resolve(resized);
        },
        "image/jpeg",
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 로드 실패"));
    };

    img.src = url;
  });
}
