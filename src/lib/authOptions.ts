import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { sendWelcomeEmail } from "@/lib/email";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "fixworkflows@gmail.com";

export const authOptions: NextAuthOptions = {
  debug: true,
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
      console.log("[OAUTH] New user created, triggering welcome email for:", user.email);
      if (user.email) {
        sendWelcomeEmail(user.email, user.name).catch((err) =>
          console.error("[EMAIL] OAuth welcome email failed:", err),
        );
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[NEXTAUTH] signIn callback:", { email: user?.email, provider: account?.provider, type: account?.type, error: (account as Record<string, unknown>)?.error });
      console.log("[NEXTAUTH] signIn profile:", JSON.stringify(profile, null, 2)?.slice(0, 500));
      return true;
    },
    async jwt({ token, user, trigger }) {
      // On initial sign-in, populate token with user fields
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            email: true,
            isAdmin: true,
            isPremium: true,
            onboardingCompleted: true,
            diagnosisCompleted: true,
            phone: true,
          },
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
          token.isPremium = dbUser.isPremium || dbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.diagnosisCompleted = dbUser.diagnosisCompleted;
          token.phone = dbUser.phone;
        }
        token.refreshedAt = Date.now();
      }

      // Re-fetch from DB when client calls update() or every 5 minutes
      const needsRefresh =
        trigger === "update" ||
        !token.refreshedAt ||
        Date.now() - (token.refreshedAt as number) > 5 * 60 * 1000;

      if (token.id && !user && needsRefresh) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            email: true,
            isAdmin: true,
            isPremium: true,
            onboardingCompleted: true,
            diagnosisCompleted: true,
            phone: true,
          },
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
          token.isPremium = dbUser.isPremium || dbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.diagnosisCompleted = dbUser.diagnosisCompleted;
          token.phone = dbUser.phone;
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
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
};
