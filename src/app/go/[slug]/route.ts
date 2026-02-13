import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toolsDatabase } from "@/data/tools";
import { accessoryProducts } from "@/data/tools";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Find the tool or accessory
  const tool = toolsDatabase.find((t) => t.slug === slug);
  const accessory = accessoryProducts.find((p) => p.slug === slug);

  const affiliateUrl = tool?.affiliateUrl || accessory?.affiliateUrl;

  if (!affiliateUrl) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Log the click
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get("source") || "direct";
  const diagnosisId = searchParams.get("diagnosis") || undefined;

  try {
    // Find tool in DB if it exists
    const dbTool = tool
      ? await prisma.tool.findUnique({ where: { slug } })
      : null;

    await prisma.affiliateClick.create({
      data: {
        slug,
        toolId: dbTool?.id,
        source,
        diagnosisId: diagnosisId || undefined,
      },
    });
  } catch {
    // Don't block redirect if logging fails
  }

  return NextResponse.redirect(affiliateUrl);
}
