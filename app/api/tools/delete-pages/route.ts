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
    const pdfDoc = await PDFDocument.load(pdfBytes)

    // 3. Delete pages (reverse order to avoid index shifting)
    const indicesToDelete = pages.map(p => p - 1).sort((a, b) => b - a)
    
    const maxPage = pdfDoc.getPageCount()
    if (indicesToDelete.some(i => i < 0 || i >= maxPage)) {
      return NextResponse.json({ error: "Invalid page numbers selected" }, { status: 400 })
    }

    if (indicesToDelete.length === maxPage) {
      return NextResponse.json({ error: "You cannot delete all pages in the document" }, { status: 400 })
    }

    indicesToDelete.forEach(index => {
      pdfDoc.removePage(index)
    })

    const finalBytes = await pdfDoc.save()

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
        originalName: `deleted-${sourceFile.originalName}`,
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
        type: "DELETE_PAGES",
        status: "COMPLETED",
        progress: 100
      }
    })

    return NextResponse.json({ 
      success: true, 
      file: finalFile
    })
  } catch (error: any) {
    console.error("Delete Pages Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
