import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTodayDate } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = getTodayDate();

    const [totalStudents, todayAttendance] = await Promise.all([
      prisma.user.count({ where: { role: "student" } }),
      prisma.attendance.findMany({
        where: { attendanceDate: today },
        distinct: ["userId"],
      }),
    ]);

    const todayPresent = todayAttendance.length;
    const todayAbsent = totalStudents - todayPresent;
    const attendancePercentage =
      totalStudents > 0
        ? Math.round((todayPresent / totalStudents) * 100)
        : 0;

    return NextResponse.json({
      totalStudents,
      todayPresent,
      todayAbsent,
      attendancePercentage,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
