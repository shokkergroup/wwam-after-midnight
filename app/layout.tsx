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
    title: "WWAM After Midnight — Ask This Tape",
    description:
      "An independent, source-locked living YouTube wiki: 510 playable source dossiers, 1,490 bounded receipts, and exact-tape answers that refuse to fake what is not indexed.",
    openGraph: {
      type: "website",
      title: "WWAM After Midnight — Ask This Tape",
      description: "510 source dossiers. 1,490 receipts. Zero wrong-tape substitutions.",
      images: [{ url: image, width: 1200, height: 630, alt: "WWAM After Midnight — Ask This Tape" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "WWAM After Midnight — Ask This Tape",
      description: "510 source dossiers. 1,490 receipts. Zero wrong-tape substitutions.",
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
