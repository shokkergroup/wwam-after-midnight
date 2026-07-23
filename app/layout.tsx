import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") || incoming.get("host") || "localhost";
  const protocol = incoming.get("x-forwarded-proto") || "https";
  const base = new URL(`${protocol}://${host}`);
  const image = new URL("/og.png", base).toString();

  return {
    metadataBase: base,
    title: "WWAM After Midnight — The Commentaries, Takes, and Lore",
    description:
      "An independent, source-linked fan prototype built around We Watched A Movie's Halloween and Friday the 13th commentary archives.",
    openGraph: {
      type: "website",
      title: "WWAM After Midnight",
      description: "The commentaries. The takes. The lore.",
      images: [{ url: image, width: 1200, height: 630, alt: "WWAM After Midnight" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "WWAM After Midnight",
      description: "The commentaries. The takes. The lore.",
      images: [image],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
