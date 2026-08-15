import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "DataFix — Clean messy data in your browser";
  const description = "A private, local-first cleaner for CSV, TSV and JSON. Standardize global dates, number formats, encodings, whitespace and missing values without uploading your files.";
  const image = new URL("/og-global.png", base).toString();
  return {
    metadataBase: base, title, description,
    openGraph: {
      title, description, type: "website", locale: "en_US", alternateLocale: ["zh_TW"],
      images: [{ url: image, width: 1536, height: 1024, alt: "DataFix — Clean messy data right in your browser." }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
