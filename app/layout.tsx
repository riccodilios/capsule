import type { Metadata } from "next";
import { Geist, Geist_Mono, Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const tajawal = Tajawal({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Capsule — Medication adherence",
  description:
    "Track medications, smart alerts, and adherence with clarity and trust.",
  icons: {
    icon: "/capsule-icon.png",
    apple: "/capsule-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      className={`${geistSans.variable} ${geistMono.variable} ${tajawal.variable} min-h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col font-sans text-capsule-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
