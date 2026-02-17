import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import AiChat from "@/components/AiChat";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "FixWorkFlow — Revenue Health Score for Small Businesses",
  description:
    "Get a free Revenue Health Score based on your real metrics. See which of 5 pillars is holding you back and follow a personalized playbook to fix it.",
  keywords: [
    "revenue health score",
    "business diagnostics",
    "small business tools",
    "revenue optimization",
    "business playbook",
    "profit optimization",
    "fix workflow",
  ],
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased bg-[#fafafa] text-[#111]`}
      >
        <Providers>
          {children}
          <AiChat />
        </Providers>
      </body>
    </html>
  );
}
