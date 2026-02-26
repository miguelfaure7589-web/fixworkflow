import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import "@/lib/integrations/providers/google-analytics";
import { getProvider } from "@/lib/integrations/registry";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "Google Analytics integration is being set up. Check back soon." },
      { status: 503 },
    );
  }

  const provider = getProvider("google-analytics");
  if (!provider) {
    return NextResponse.json({ error: "Google Analytics provider not available" }, { status: 500 });
  }

  try {
    const authUrl = provider.getAuthUrl(userId, "");
    return NextResponse.json({ authUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
