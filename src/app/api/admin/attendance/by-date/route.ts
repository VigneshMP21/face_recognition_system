import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "A valid date (YYYY-MM-DD) is required" },
        { status: 400 }
      );
    }

    // All students plus their attendance row (if any) for the given date
    const students = await prisma.user.findMany({
      where: { role: "student" },
      orderBy: { rollNumber: "asc" },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        attendance: {
          where: { attendanceDate: date },
          take: 1,
        },
      },
    });

    const records = students.map((s) => {
      const record = s.attendance[0];
      return {
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        status: record ? "Present" : "Absent",
        time: record?.attendanceTime || null,
      };
    });

    return NextResponse.json({ date, records });
  } catch (error) {
    console.error("Attendance by-date error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
