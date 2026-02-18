import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  alternates: { canonical: "/signup" },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
