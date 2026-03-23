"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface UploadState {
  files: File[];
  style: string | null;
  setFiles: (files: File[]) => void;
  setStyle: (style: string) => void;
  reset: () => void;
}

const UploadContext = createContext<UploadState | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<File[]>([]);
  const [style, setStyle] = useState<string | null>(null);

  const reset = useCallback(() => {
    setFiles([]);
    setStyle(null);
  }, []);

  return (
    <UploadContext.Provider value={{ files, style, setFiles, setStyle, reset }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload(): UploadState {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used within UploadProvider");
  return ctx;
}
