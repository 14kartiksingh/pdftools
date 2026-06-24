import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { PDFDocument } from "pdf-lib"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileIds } = await req.json()
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: "File IDs are required" }, { status: 400 })
    }

    // 1. Fetch source files from DB
    const sourceFiles = await prisma.file.findMany({
      where: { 
        id: { in: fileIds },
        userId: session.user.id 
      }
    })

    if (sourceFiles.length !== fileIds.length) {
      return NextResponse.json({ error: "One or more files not found or unauthorized" }, { status: 404 })
    }

    // Sort files to match the order in fileIds array
    const sortedFiles = fileIds.map(id => sourceFiles.find(f => f.id === id)).filter(Boolean) as typeof sourceFiles

    // 2. Create new PDF Document
    const pdfDoc = await PDFDocument.create()

    for (const file of sortedFiles) {
      const imgBytes = fs.readFileSync(file.storagePath)
      
      let img;
      if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/jpg' || file.fileName.toLowerCase().endsWith('.jpg') || file.fileName.toLowerCase().endsWith('.jpeg')) {
        img = await pdfDoc.embedJpg(imgBytes)
      } else if (file.mimeType === 'image/png' || file.fileName.toLowerCase().endsWith('.png')) {
        img = await pdfDoc.embedPng(imgBytes)
      } else {
        throw new Error(`Unsupported image format for file: ${file.originalName}`)
      }

      const { width, height } = img
      const page = pdfDoc.addPage([width, height])
      page.drawImage(img, {
        x: 0,
        y: 0,
        width,
        height,
      })
    }

    const pdfBytes = await pdfDoc.save()

    // 3. Save new PDF
    const processedDir = path.join(process.cwd(), "storage", "processed")
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true })
    }

    const newFileName = `${uuidv4()}.pdf`
    const newStoragePath = path.join(processedDir, newFileName)
    fs.writeFileSync(newStoragePath, pdfBytes)

    const stats = fs.statSync(newStoragePath)

    // 4. Create DB record
    const resultFile = await prisma.file.create({
      data: {
        userId: session.user.id,
        fileName: newFileName,
        originalName: "converted-images.pdf",
        fileSize: stats.size,
        mimeType: "application/pdf",
        storagePath: newStoragePath
      }
    })

    return NextResponse.json({ success: true, file: resultFile })
  } catch (error: any) {
    console.error("Image to PDF Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
