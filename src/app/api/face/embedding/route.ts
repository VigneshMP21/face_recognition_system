import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const record = await prisma.faceEmbedding.findFirst({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ registered: false, embedding: null });
    }

    let embedding: number[] = [];
    try {
      embedding = JSON.parse(record.embedding);
    } catch {
      embedding = [];
    }

    return NextResponse.json({ registered: true, embedding });
  } catch (error) {
    console.error("Face embedding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
