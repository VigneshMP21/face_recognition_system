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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: any = { role: "student" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { rollNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          attendance: {
            orderBy: { attendanceDate: "desc" },
            take: 1,
          },
          _count: {
            select: { attendance: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const data = students.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      email: s.email,
      mobile: s.mobile,
      attendanceCount: s._count.attendance,
      lastAttendanceDate: s.attendance[0]?.attendanceDate || null,
      lastAttendanceTime: s.attendance[0]?.attendanceTime || null,
    }));

    return NextResponse.json({
      students: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
