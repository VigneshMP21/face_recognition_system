import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDate, getCurrentTime } from "@/lib/utils";

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const embeddings = await prisma.faceEmbedding.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            email: true,
            mobile: true,
            role: true,
          },
        },
      },
    });

    if (embeddings.length === 0) {
      return NextResponse.json(
        { error: "No registered faces found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Face recognition not available in server mode. Use browser-based recognition." },
      { status: 501 }
    );
  } catch (error) {
    console.error("Face recognition error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
