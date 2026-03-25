"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUpload } from "@/lib/upload-context";

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 15;

const FACE_TIPS = [
  { emoji: "😊", text: "정면 얼굴이 잘 보이는 사진" },
  { emoji: "💡", text: "밝은 조명에서 촬영한 사진" },
  { emoji: "🚫", text: "선글라스·마스크 착용 사진 제외" },
  { emoji: "🔄", text: "다양한 각도와 표정이 좋아요" },
];

export default function UploadPage() {
  const router = useRouter();
  const upload = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>(upload.files);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Generate/cleanup preview URLs
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const imageFiles = Array.from(newFiles).filter((f) =>
        f.type.startsWith("image/")
      );
      setFiles((prev) => {
        const combined = [...prev, ...imageFiles];
        if (combined.length > MAX_PHOTOS) {
          return combined.slice(0, MAX_PHOTOS);
        }
        return combined;
      });
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles]
  );

  const canProceed = files.length >= MIN_PHOTOS;

  function handleNext() {
    upload.setFiles(files);
    router.push("/style");
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <header className="px-5 pt-12 pb-4 text-center md:pt-16">
        <h1 className="text-xl font-bold md:text-2xl">사진 업로드</h1>
        <p className="mt-1 text-sm text-gray-500">
          AI 모델 학습에 사용할 셀카를 올려주세요
        </p>
      </header>

      <div className="mx-auto max-w-lg px-5">
        {/* Face guide */}
        <div className="mb-5 rounded-2xl bg-blue-50 p-4">
          <p className="mb-2 text-sm font-semibold text-primary">
            📸 좋은 사진 가이드
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FACE_TIPS.map((tip) => (
              <div
                key={tip.text}
                className="flex items-start gap-2 text-xs text-gray-600"
              >
                <span className="shrink-0 text-base">{tip.emoji}</span>
                <span className="leading-snug">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-200"
          }`}
        >
          <p className="mb-1 text-sm text-gray-500">
            최소 {MIN_PHOTOS}장, 최대 {MAX_PHOTOS}장 · JPG, PNG
          </p>
          <p className="mb-4 text-xs text-blue-500">
            💡 더 좋은 품질을 위해 8장 이상 업로드를 추천합니다
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-primary py-4 text-white shadow-md shadow-primary/20 transition active:scale-[0.97] md:hidden"
            >
              <span className="text-2xl">📷</span>
              <span className="text-sm font-semibold">직접 촬영</span>
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-1 flex-col items-center gap-2 rounded-xl border-2 border-gray-200 py-4 text-gray-700 transition hover:border-gray-300 active:scale-[0.97] md:border-primary md:bg-primary md:text-white md:shadow-md md:shadow-primary/20"
            >
              <span className="text-2xl">🖼️</span>
              <span className="text-sm font-semibold">앨범에서 선택</span>
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            또는 이 영역에 드래그해서 올리기
          </p>
        </div>

        {/* Thumbnail grid */}
        {files.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                업로드된 사진{" "}
                <span
                  className={
                    canProceed ? "text-primary" : "text-orange-500"
                  }
                >
                  {files.length}/{MIN_PHOTOS}~{MAX_PHOTOS}장
                </span>
              </p>
              {files.length < MIN_PHOTOS && (
                <p className="text-xs text-orange-500">
                  {MIN_PHOTOS - files.length}장 더 필요해요
                </p>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="group relative aspect-square">
                  <Image
                    src={src}
                    alt={`사진 ${i + 1}`}
                    fill
                    className="rounded-xl object-cover"
                    unoptimized
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100 active:opacity-100"
                    aria-label={`사진 ${i + 1} 삭제`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Add more buttons */}
              {files.length < MAX_PHOTOS && (
                <>
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary/30 text-primary transition hover:border-primary/50 md:hidden"
                  >
                    <span className="text-lg">📷</span>
                    <span className="text-[10px] font-medium">촬영</span>
                  </button>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-gray-300"
                  >
                    <span className="text-lg">+</span>
                    <span className="text-[10px] font-medium">앨범</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="shrink-0 text-sm text-gray-500">
            <span className="font-bold text-gray-900">{files.length}</span>/
            {MIN_PHOTOS}장
          </div>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 transition active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
          >
            {canProceed ? "스타일 선택하기 →" : `사진 ${MIN_PHOTOS}장 이상 필요`}
          </button>
        </div>
      </div>
    </div>
  );
}
