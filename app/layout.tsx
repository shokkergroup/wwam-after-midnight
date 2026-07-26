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
    title: "WWAM After Midnight — The Living Archive",
    description:
      "Watch, search and explore We Watched A Movie history through playable show wikis, source-linked moments, recurring characters and a living 2025–2026 canon.",
    openGraph: {
      type: "website",
      title: "WWAM After Midnight — The Living Archive",
      description: "Every show becomes a playable wiki: summaries, best moments, topic jumps, movie context and source-linked WWAM lore.",
      images: [{ url: image, width: 1200, height: 630, alt: "WWAM After Midnight — The Living Archive" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "WWAM After Midnight — The Living Archive",
      description: "Every show becomes a playable wiki: summaries, best moments, topic jumps, movie context and source-linked WWAM lore.",
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
