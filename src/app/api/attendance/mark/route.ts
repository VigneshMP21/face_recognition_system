import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDate, getCurrentTime } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const today = getTodayDate();

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_attendanceDate: {
          userId,
          attendanceDate: today,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: "Attendance Already Marked Today",
        alreadyMarked: true,
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        attendanceDate: today,
        attendanceTime: getCurrentTime(),
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        email: true,
        mobile: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      attendance,
      user,
    });
  } catch (error) {
    console.error("Attendance mark error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
