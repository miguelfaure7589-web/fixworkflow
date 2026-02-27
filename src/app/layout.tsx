import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import Script from "next/script";
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

export const viewport: Viewport = {
  themeColor: "#4361ee",
};

export const metadata: Metadata = {
  verification: {
    google: "googleefed4deaad0ba2bf.html",
  },
  metadataBase: new URL("https://fixworkflow.com"),
  alternates: { canonical: "/" },
  title: {
    template: "%s | FixWorkFlow",
    default: "FixWorkFlow — Revenue Health Score for Small Businesses",
  },
  description:
    "Get your free Revenue Health Score. See which of 5 business pillars is costing you money and follow a personalized playbook to fix it in 30 days.",
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
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "FixWorkFlow — Your Business is Leaking Money. We'll Show You Where.",
    description:
      "Get your free Revenue Health Score based on your real metrics. See which of 5 pillars is holding you back. Follow a step-by-step playbook to fix it.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FixWorkFlow — Your Business is Leaking Money. We'll Show You Where.",
    description:
      "Get your free Revenue Health Score based on your real metrics. See which of 5 pillars is holding you back. Follow a step-by-step playbook to fix it.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased transition-colors duration-200`}
        style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-F46KFQ5SGS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F46KFQ5SGS');
          `}
        </Script>
        <Providers>
          {children}
          <AiChat />
        </Providers>
      </body>
    </html>
  );
}
