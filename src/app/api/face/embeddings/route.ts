import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const records = await prisma.faceEmbedding.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const embeddings = records.map((record) => {
      let embedding: number[] = [];
      try {
        embedding = JSON.parse(record.embedding);
      } catch {
        embedding = [];
      }
      return {
        userId: record.userId,
        userName: record.user.name,
        rollNumber: record.user.rollNumber,
        embedding,
      };
    });

    return NextResponse.json({ embeddings });
  } catch (error) {
    console.error("Face embeddings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
