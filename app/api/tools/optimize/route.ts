import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { PDFDocument } from "pdf-lib"
import { readFile, writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"

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

    // 2. Load PDF into pdf-lib
    const pdfBytes = await readFile(sourceFile.storagePath)
    const pdfDoc = await PDFDocument.load(pdfBytes)

    // 3. Optimize PDF (Save with object streams and compress)
    const optimizedBytes = await pdfDoc.save({ useObjectStreams: true })

    // 4. Save to disk
    const processedDir = path.join(process.cwd(), "storage", "processed")
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true })
    }

    const newFileName = `${uuidv4()}.pdf`
    const newStoragePath = path.join(processedDir, newFileName)
    await writeFile(newStoragePath, optimizedBytes)

    // 5. Create new file record
    const optimizedFile = await prisma.file.create({
      data: {
        userId: session.user.id,
        fileName: newFileName,
        originalName: `optimized-${sourceFile.originalName}`,
        fileSize: optimizedBytes.length,
        mimeType: "application/pdf",
        storagePath: newStoragePath
      }
    })

    // 6. Create Job record
    await prisma.job.create({
      data: {
        userId: session.user.id,
        fileId: optimizedFile.id,
        type: "COMPRESS", // Using COMPRESS for optimization in enum
        status: "COMPLETED",
        progress: 100
      }
    })

    return NextResponse.json({ 
      success: true, 
      file: optimizedFile,
      originalSize: sourceFile.fileSize,
      newSize: optimizedBytes.length 
    })
  } catch (error: any) {
    console.error("Optimize PDF Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
