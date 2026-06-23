import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const bcrypt = (await import("bcryptjs")).default
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    })

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("\n=== REGISTRATION ERROR DIAGNOSTICS ===");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    if (error.code) console.error("Error Code (e.g. Prisma):", error.code);
    if (error.meta) console.error("Error Meta:", error.meta);
    console.error("Full Stack Trace:", error.stack);
    console.error("Raw Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("======================================\n");

    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error.message,
        code: error.code || "UNKNOWN"
      },
      { status: 500 }
    )
  }
}
