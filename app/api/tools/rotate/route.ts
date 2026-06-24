import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { PDFDocument, degrees as pdfDegrees } from "pdf-lib"
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

    const { fileId, pages, angle } = await req.json()
    if (!fileId || typeof angle !== 'number') {
      return NextResponse.json({ error: "File ID and angle are required" }, { status: 400 })
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

    const maxPage = pdfDoc.getPageCount()
    
    // Determine which pages to rotate
    let targetPages: number[] = []
    if (pages && Array.isArray(pages) && pages.length > 0) {
      targetPages = pages.map(p => p - 1)
      if (targetPages.some(i => i < 0 || i >= maxPage)) {
        return NextResponse.json({ error: "Invalid page numbers selected" }, { status: 400 })
      }
    } else {
      // Rotate all pages
      for (let i = 0; i < maxPage; i++) {
        targetPages.push(i)
      }
    }

    // 3. Rotate pages
    targetPages.forEach(index => {
      const page = pdfDoc.getPage(index)
      const currentRotation = page.getRotation().angle
      page.setRotation(pdfDegrees((currentRotation + angle) % 360))
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
        originalName: `rotated-${sourceFile.originalName}`,
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
        type: "ROTATE",
        status: "COMPLETED",
        progress: 100
      }
    })

    return NextResponse.json({ 
      success: true, 
      file: finalFile
    })
  } catch (error: any) {
    console.error("Rotate PDF Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
