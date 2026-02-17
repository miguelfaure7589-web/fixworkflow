import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;

  let body: { toolId?: string; slug?: string; source?: string; context?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.toolId && !body.slug) {
    return Response.json({ error: "toolId or slug required" }, { status: 400 });
  }

  await prisma.affiliateClick.create({
    data: {
      userId,
      toolId: body.toolId ?? null,
      slug: body.slug ?? body.toolId ?? "",
      source: body.source ?? "revenue-dashboard",
      diagnosisId: null,
    },
  });

  return Response.json({ ok: true });
}
