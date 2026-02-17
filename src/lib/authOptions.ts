import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
        (session.user as any).isAdmin = (user as any).isAdmin;
        (session.user as any).isPremium = (user as any).isPremium;
        (session.user as any).onboardingCompleted = (user as any).onboardingCompleted;
        (session.user as any).diagnosisCompleted = (user as any).diagnosisCompleted;
      }
      return session;
    },
  },
};
