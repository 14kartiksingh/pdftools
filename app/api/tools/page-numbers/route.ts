import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
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

    const { fileId, position } = await req.json()
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

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = pdfDoc.getPages()
    const totalPages = pages.length
    
    // 3. Draw page numbers on each page
    pages.forEach((page, idx) => {
      const { width, height } = page.getSize()
      const fontSize = 12
      const text = `${idx + 1} of ${totalPages}`
      const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize)
      
      let x = 0
      let y = 0
      
      const paddingX = 30
      const paddingY = 30

      switch (position) {
        case "BOTTOM_LEFT":
          x = paddingX
          y = paddingY
          break
        case "BOTTOM_RIGHT":
          x = width - paddingX - textWidth
          y = paddingY
          break
        case "TOP_CENTER":
          x = width / 2 - textWidth / 2
          y = height - paddingY - fontSize
          break
        case "TOP_LEFT":
          x = paddingX
          y = height - paddingY - fontSize
          break
        case "TOP_RIGHT":
          x = width - paddingX - textWidth
          y = height - paddingY - fontSize
          break
        case "BOTTOM_CENTER":
        default:
          x = width / 2 - textWidth / 2
          y = paddingY
          break
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      })
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
        originalName: `numbered-${sourceFile.originalName}`,
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
        type: "ADD_PAGE_NUMBERS",
        status: "COMPLETED",
        progress: 100
      }
    })

    return NextResponse.json({ 
      success: true, 
      file: finalFile
    })
  } catch (error: any) {
    console.error("Page Numbers PDF Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
