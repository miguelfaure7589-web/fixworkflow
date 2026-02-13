import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FixWorkflow — AI Workflow Diagnosis for Remote Workers & Freelancers",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
