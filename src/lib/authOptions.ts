import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { sendWelcomeEmail } from "@/lib/email";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  events: {
    // Send welcome email when a user is created via OAuth (Google)
    async createUser({ user }) {
      if (user.email) {
        sendWelcomeEmail(user.email, user.name).catch((err) =>
          console.error("[EMAIL] OAuth welcome email failed:", err),
        );
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign-in, populate token with user fields
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            isAdmin: true,
            isPremium: true,
            onboardingCompleted: true,
            diagnosisCompleted: true,
          },
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
          token.isPremium = dbUser.isPremium;
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.diagnosisCompleted = dbUser.diagnosisCompleted;
        }
        token.refreshedAt = Date.now();
      }

      // Re-fetch from DB every 5 minutes to keep token fresh
      if (
        token.id &&
        (!token.refreshedAt ||
          Date.now() - (token.refreshedAt as number) > 5 * 60 * 1000)
      ) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            isAdmin: true,
            isPremium: true,
            onboardingCompleted: true,
            diagnosisCompleted: true,
          },
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
          token.isPremium = dbUser.isPremium;
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.diagnosisCompleted = dbUser.diagnosisCompleted;
        }
        token.refreshedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin;
        (session.user as any).isPremium = token.isPremium;
        (session.user as any).onboardingCompleted = token.onboardingCompleted;
        (session.user as any).diagnosisCompleted = token.diagnosisCompleted;
      }
      return session;
    },
  },
};
