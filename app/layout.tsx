import type { Metadata, Viewport } from "next";
import { UploadProvider } from "@/lib/upload-context";
import GlobalHeader from "@/components/GlobalHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "찰칵AI — 나만의 AI 사진작가",
  description:
    "셀카 8장으로 증명사진부터 카카오·인스타 프로필까지. 한국인 특화 AI 사진 서비스.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "찰칵AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
      </head>
      <body className="bg-white pt-12 text-gray-900 antialiased">
        <GlobalHeader />
        <UploadProvider>{children}</UploadProvider>
      </body>
    </html>
  );
}
