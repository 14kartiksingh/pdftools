import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Queue } from "bullmq"
import IORedis from "ioredis"

export const dynamic = "force-dynamic"

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null
})

const pdfQueue = new Queue("pdf-jobs", { connection: connection as any })

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId, password } = await req.json()
    if (!fileId || !password) {
      return NextResponse.json({ error: "File ID and password are required" }, { status: 400 })
    }

    // 1. Fetch file record
    const sourceFile = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!sourceFile || sourceFile.userId !== session.user.id) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // 2. Create Job record
    const jobRecord = await prisma.job.create({
      data: {
        userId: session.user.id,
        fileId: sourceFile.id,
        type: "PROTECT",
        status: "PENDING"
      }
    })

    // 3. Dispatch to BullMQ
    await pdfQueue.add("PROTECT", {
      jobId: jobRecord.id,
      userId: session.user.id,
      fileId: sourceFile.id,
      sourcePath: sourceFile.storagePath,
      originalName: sourceFile.originalName,
      password: password
    })

    return NextResponse.json({ 
      success: true, 
      jobId: jobRecord.id 
    })
  } catch (error: any) {
    console.error("Protect PDF Dispatch Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
