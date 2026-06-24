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

    const { fileId, pages } = await req.json()
    if (!fileId || !pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: "File ID and selected pages are required" }, { status: 400 })
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
    const sourceDoc = await PDFDocument.load(pdfBytes)

    // 3. Create new PDF and extract pages
    const newDoc = await PDFDocument.create()
    
    // pdf-lib page indices are 0-based. Our UI is 1-based.
    const indicesToExtract = pages.map(p => p - 1)
    
    // Validate indices
    const maxPage = sourceDoc.getPageCount()
    if (indicesToExtract.some(i => i < 0 || i >= maxPage)) {
      return NextResponse.json({ error: "Invalid page numbers selected" }, { status: 400 })
    }

    const copiedPages = await newDoc.copyPages(sourceDoc, indicesToExtract)
    copiedPages.forEach(page => newDoc.addPage(page))

    const finalBytes = await newDoc.save()

    // 4. Save to disk
    const processedDir = path.join(process.cwd(), "storage", "processed")
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true })
    }

    const newFileName = `${uuidv4()}.pdf`
    const newStoragePath = path.join(processedDir, newFileName)
    await writeFile(newStoragePath, finalBytes)

    // 5. Create new file record
    const finalFile = await prisma.file.create({
      data: {
        userId: session.user.id,
        fileName: newFileName,
        originalName: `extracted-${sourceFile.originalName}`,
        fileSize: finalBytes.length,
        mimeType: "application/pdf",
        storagePath: newStoragePath
      }
    })

    // 6. Create Job record
    await prisma.job.create({
      data: {
        userId: session.user.id,
        fileId: finalFile.id,
        type: "EXTRACT",
        status: "COMPLETED",
        progress: 100
      }
    })

    return NextResponse.json({ 
      success: true, 
      file: finalFile
    })
  } catch (error: any) {
    console.error("Extract PDF Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
