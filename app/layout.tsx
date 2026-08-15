import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "DataFix TW — 台灣資料清理工具";
  const description = "在瀏覽器本機修好 Big5 亂碼、民國日期、千分位與全形字元。免費、不用登入，資料不離開裝置。";
  const image = new URL("/og.png", base).toString();

  return {
    metadataBase: base,
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "zh_TW",
      images: [{ url: image, width: 1717, height: 916, alt: "DataFix TW — 台灣資料，整理好了。" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
