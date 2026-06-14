import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, rollNumber, email, mobile, password } = await req.json();

    if (!name || !rollNumber || !email || !mobile || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const existingRoll = await prisma.user.findUnique({
      where: { rollNumber },
    });
    if (existingRoll) {
      return NextResponse.json(
        { error: "Roll number already exists" },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        name,
        rollNumber,
        email,
        mobile,
        passwordHash,
        role: "student",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
