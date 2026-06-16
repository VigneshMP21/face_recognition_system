import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get last 7 days data
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    // Get all attendance records for the last 7 days
    const attendances = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: sevenDaysAgo.toISOString().split("T")[0],
          lte: today.toISOString().split("T")[0],
        },
      },
      select: {
        attendanceDate: true,
      },
    });

    // Get total students
    const totalStudents = await prisma.user.count({ where: { role: "student" } });

    // Process daily data for the last 7 days
    const dailyData: Record<string, { present: number; absent: number }> = {};

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = { present: 0, absent: 0 };
    }

    // Count attendance by date (a record means present)
    const attendanceCountByDate: Record<string, number> = {};
    attendances.forEach((record) => {
      if (!attendanceCountByDate[record.attendanceDate]) {
        attendanceCountByDate[record.attendanceDate] = 0;
      }
      attendanceCountByDate[record.attendanceDate]++;
    });

    // Update daily data with counts
    Object.keys(dailyData).forEach((date) => {
      dailyData[date].present = attendanceCountByDate[date] || 0;
    });

    // Format weekly data
    const weeklyData = Object.entries(dailyData).map(([date, data]) => {
      const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
      return {
        date: dayName,
        fullDate: date,
        present: data.present,
        absent: totalStudents - data.present,
        total: totalStudents,
        percentage: totalStudents > 0 ? Math.round((data.present / totalStudents) * 100) : 0,
      };
    });

    // Get monthly data (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    const monthlyAttendances = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: thirtyDaysAgo.toISOString().split("T")[0],
          lte: today.toISOString().split("T")[0],
        },
      },
      select: {
        attendanceDate: true,
      },
    });

    // Group by week - count total records per week (each record = present)
    const monthlyRecordCount: Record<string, number> = {};

    monthlyAttendances.forEach((record) => {
      const date = new Date(record.attendanceDate);
      const weekNum = Math.ceil((date.getTime() - thirtyDaysAgo.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weekKey = `Week ${weekNum}`;

      if (!monthlyRecordCount[weekKey]) {
        monthlyRecordCount[weekKey] = 0;
      }
      monthlyRecordCount[weekKey]++;
    });

    const monthlyChartData = Object.entries(monthlyRecordCount).map(([week, count]) => ({
      week,
      attendance: totalStudents > 0 ? Math.round((count / (totalStudents * 4)) * 100) : 0, // Approx 4 days per week
    }));

    // Get attendance by day of week (historical data for pattern analysis)
    const allAttendance = await prisma.attendance.findMany({
      select: {
        attendanceDate: true,
      },
      orderBy: { attendanceDate: "desc" },
      take: 1000, // Last 1000 records for pattern
    });

    const dayOfWeekData: Record<string, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };

    // Count attendance records by day of week
    allAttendance.forEach((record) => {
      const dayName = new Date(record.attendanceDate).toLocaleDateString("en-US", { weekday: "long" });
      if (dayOfWeekData[dayName] !== undefined) {
        dayOfWeekData[dayName]++;
      }
    });

    const dayOfWeekChartData = Object.entries(dayOfWeekData).map(([day, count]) => ({
      day: day.substring(0, 3),
      fullDay: day,
      attendance: count > 0 ? Math.round((count / totalStudents) * 100) : 0,
      students: count,
    }));

    // Recent activity (last 10 attendance records)
    const recentActivity = await prisma.attendance.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    const activityData = recentActivity.map((record) => ({
      id: record.id,
      studentName: record.user.name,
      status: "present", // Attendance record means present
      date: record.attendanceDate,
      time: record.createdAt?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) || "N/A",
    }));

    return NextResponse.json({
      weeklyData,
      monthlyChartData,
      dayOfWeekChartData,
      activityData,
      totalStudents,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}