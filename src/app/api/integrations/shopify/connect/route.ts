import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import "@/lib/integrations/providers/shopify";
import { getProvider } from "@/lib/integrations/registry";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Shopify integration is being set up. Check back soon." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const storeDomain = body.storeDomain as string | undefined;
  if (!storeDomain || storeDomain.trim().length === 0) {
    return NextResponse.json({ error: "Store domain is required" }, { status: 400 });
  }

  const provider = getProvider("shopify");
  if (!provider) {
    return NextResponse.json({ error: "Shopify provider not available" }, { status: 500 });
  }

  try {
    const authUrl = provider.getAuthUrl(userId, "", { storeDomain: storeDomain.trim() });
    return NextResponse.json({ authUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
