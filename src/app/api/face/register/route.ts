import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { embedding } = await req.json();
    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json(
        { error: "Invalid embedding data" },
        { status: 400 }
      );
    }

    // Ensure only one active face embedding per user: remove old ones, then add new.
    await prisma.faceEmbedding.deleteMany({
      where: { userId: session.id },
    });

    await prisma.faceEmbedding.create({
      data: {
        userId: session.id,
        embedding: JSON.stringify(embedding),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Face registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
