import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib"
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

    const { fileId, text, position, opacity } = await req.json()
    if (!fileId || !text) {
      return NextResponse.json({ error: "File ID and watermark text are required" }, { status: 400 })
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

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const pages = pdfDoc.getPages()
    
    // 3. Draw watermark on each page
    pages.forEach((page) => {
      const { width, height } = page.getSize()
      const fontSize = 60
      const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize)
      const textHeight = helveticaFont.heightAtSize(fontSize)
      
      let x = 0
      let y = 0
      let rotate = degrees(0)
      
      const padding = 50

      switch (position) {
        case "CENTER":
          x = width / 2 - textWidth / 2
          y = height / 2 - textHeight / 2
          break
        case "TOP_LEFT":
          x = padding
          y = height - padding - textHeight
          break
        case "TOP_RIGHT":
          x = width - padding - textWidth
          y = height - padding - textHeight
          break
        case "BOTTOM_LEFT":
          x = padding
          y = padding
          break
        case "BOTTOM_RIGHT":
          x = width - padding - textWidth
          y = padding
          break
        case "DIAGONAL":
        default:
          x = width / 2 - (textWidth / 2) * Math.cos(Math.PI / 4) + (textHeight / 2) * Math.sin(Math.PI / 4)
          y = height / 2 - (textWidth / 2) * Math.sin(Math.PI / 4) - (textHeight / 2) * Math.cos(Math.PI / 4)
          rotate = degrees(45)
          break
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        opacity: opacity || 0.5,
        rotate,
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
        originalName: `watermarked-${sourceFile.originalName}`,
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
        type: "ADD_WATERMARK",
        status: "COMPLETED",
        progress: 100
      }
    })

    return NextResponse.json({ 
      success: true, 
      file: finalFile
    })
  } catch (error: any) {
    console.error("Watermark PDF Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
