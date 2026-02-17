import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // This app uses OAuth (Google) — no password management needed
  return NextResponse.json(
    { error: "Password management is not available for OAuth accounts" },
    { status: 400 }
  );
}
