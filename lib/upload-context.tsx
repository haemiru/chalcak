"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type Gender = "female" | "male";

interface UploadState {
  files: File[];
  style: string | null;
  gender: Gender;
  setFiles: (files: File[]) => void;
  setStyle: (style: string) => void;
  setGender: (gender: Gender) => void;
  reset: () => void;
}

const UploadContext = createContext<UploadState | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<File[]>([]);
  const [style, setStyle] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender>("female");

  const reset = useCallback(() => {
    setFiles([]);
    setStyle(null);
    setGender("female");
  }, []);

  return (
    <UploadContext.Provider value={{ files, style, gender, setFiles, setStyle, setGender, reset }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload(): UploadState {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used within UploadProvider");
  return ctx;
}
