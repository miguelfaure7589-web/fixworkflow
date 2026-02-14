import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AiChat from "@/components/AiChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FixWorkFlow — AI Workflow Diagnosis for Remote Workers & Freelancers",
  description:
    "Free AI-powered workflow diagnostic. Discover what's slowing you down and get a personalized plan to fix it. For remote workers, freelancers, and small teams.",
  keywords: [
    "workflow optimization",
    "productivity tools",
    "remote work tools",
    "freelancer tools",
    "project management",
    "workflow automation",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#fafafa] text-[#111]`}
      >
        {children}
        <AiChat />
      </body>
    </html>
  );
}
