import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const today = new Date();

    // Get last 7 days attendance for this student
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const weeklyAttendance = await prisma.attendance.findMany({
      where: {
        userId,
        attendanceDate: {
          gte: sevenDaysAgo.toISOString().split("T")[0],
          lte: today.toISOString().split("T")[0],
        },
      },
      orderBy: { attendanceDate: "asc" },
    });

    // Create weekly data for chart
    const weeklyData: Record<string, { date: string; present: boolean }> = {};

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      weeklyData[dateStr] = { date: dateStr, present: false };
    }

    // Mark present days
    weeklyAttendance.forEach((record) => {
      if (weeklyData[record.attendanceDate]) {
        weeklyData[record.attendanceDate].present = true;
      }
    });

    const chartData = Object.entries(weeklyData).map(([date, data]) => {
      const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
      return {
        date: dayName,
        fullDate: date,
        status: data.present ? "Present" : "Absent",
        value: data.present ? 1 : 0,
      };
    });

    // Get monthly data (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    const monthlyAttendance = await prisma.attendance.findMany({
      where: {
        userId,
        attendanceDate: {
          gte: thirtyDaysAgo.toISOString().split("T")[0],
          lte: today.toISOString().split("T")[0],
        },
      },
    });

    const totalDays = 30;
    const presentDays = monthlyAttendance.length;
    const attendanceRate = Math.round((presentDays / totalDays) * 100);

    // Get all-time stats
    const totalRecords = await prisma.attendance.count({
      where: { userId },
    });

    // Get attendance history (last 10 records)
    const recentHistory = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { attendanceDate: "desc" },
      take: 10,
    });

    const historyData = recentHistory.map((record) => ({
      id: record.id,
      date: record.attendanceDate,
      time: record.attendanceTime,
      status: "Present",
    }));

    return NextResponse.json({
      weeklyData: chartData,
      presentDays,
      totalDays,
      attendanceRate,
      totalRecords,
      historyData,
    });
  } catch (error) {
    console.error("Student analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}