import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import { addPdfJob } from "@/lib/queue"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId } = await req.json()
    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // 1. Fetch file record
    const sourceFile = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!sourceFile || sourceFile.userId !== session.user.id) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // 2. Prepare output path
    const processedDir = path.join(process.cwd(), "storage", "processed")
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true })
    }

    const newFileName = `${uuidv4()}.zip`
    const newStoragePath = path.join(processedDir, newFileName)

    // 3. Create Job record
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        fileId: sourceFile.id,
        type: "TO_IMAGE",
        status: "PENDING",
        progress: 0
      }
    })

    // 4. Dispatch job to BullMQ
    await addPdfJob(job.id, "TO_IMAGE", {
      inputPath: sourceFile.storagePath,
      outputPath: newStoragePath,
      userId: session.user.id,
      originalName: sourceFile.originalName,
      originalSize: sourceFile.fileSize,
      newFileName
    })

    return NextResponse.json({ 
      success: true, 
      jobId: job.id,
      status: "PENDING"
    }, { status: 202 })
  } catch (error: any) {
    console.error("PDF to Image Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
