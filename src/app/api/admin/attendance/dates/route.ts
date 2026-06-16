import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.attendance.findMany({
      distinct: ["attendanceDate"],
      select: { attendanceDate: true },
      orderBy: { attendanceDate: "desc" },
    });

    return NextResponse.json({ dates: rows.map((r) => r.attendanceDate) });
  } catch (error) {
    console.error("Attendance dates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
