import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
