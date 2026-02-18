import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "See what freelancers, consultants, and small teams say about FixWorkFlow's AI-powered workflow diagnosis.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
