import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: { file: true }
    })

    if (!job || job.userId !== session.user.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      id: job.id,
      status: job.status,
      progress: job.progress,
      result: job.result ? JSON.parse(job.result) : null,
      error: job.error,
      file: job.file
    })
  } catch (error: any) {
    console.error("Fetch Job Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
