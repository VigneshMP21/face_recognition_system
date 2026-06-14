import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTodayDate } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const today = getTodayDate();

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_attendanceDate: {
          userId: session.id,
          attendanceDate: today,
        },
      },
    });

    return NextResponse.json({
      marked: !!attendance,
      attendance,
    });
  } catch (error) {
    console.error("Today attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
