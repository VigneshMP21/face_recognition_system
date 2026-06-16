import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const students = await prisma.user.findMany({
      where: { role: "student" },
      orderBy: { rollNumber: "asc" },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        _count: { select: { faceEmbeddings: true } },
      },
    });

    const records = students.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      faceRegistered: s._count.faceEmbeddings > 0,
    }));

    return NextResponse.json({ students: records });
  } catch (error) {
    console.error("Face register students error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
