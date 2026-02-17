import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getCachedSnapshot } from "@/lib/RecalculationEngine";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // @ts-ignore
  if (!session.user.isPremium) {
    return new Response("Upgrade required", { status: 402 });
  }

  // @ts-ignore
  const snapshot = await getCachedSnapshot(session.user.id);

  if (!snapshot) {
    return Response.json({ data: null });
  }

  return Response.json({ data: snapshot });
}
