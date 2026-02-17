import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // @ts-ignore
  if (!session.user.isPremium) {
    return new Response("Upgrade required", { status: 402 });
  }

  const { id } = await params;

  const diagnosis = await prisma.diagnosis.findUnique({
    where: { id },
    include: { recommendations: { orderBy: { order: "asc" } } },
  });

  if (!diagnosis) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(diagnosis.recommendations);
}
