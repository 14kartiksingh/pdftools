import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { PDFDocument } from "pdf-lib"
import { readFile, writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import AdmZip from "adm-zip"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId, mode, ranges } = await req.json()
    // mode can be 'all' or 'custom'
    // ranges is an array of strings like "1-3", "4", "5-7"
    if (!fileId || !mode) {
      return NextResponse.json({ error: "File ID and mode are required" }, { status: 400 })
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
    const maxPage = sourceDoc.getPageCount()

    // 3. Determine the splits
    let splits: number[][] = [] // array of page index arrays
    if (mode === "all") {
      for (let i = 0; i < maxPage; i++) {
        splits.push([i])
      }
    } else if (mode === "custom" && ranges && Array.isArray(ranges)) {
      for (const rangeStr of ranges) {
        const parts = rangeStr.split("-").map(s => parseInt(s.trim()))
        if (parts.length === 1 && !isNaN(parts[0])) {
          splits.push([parts[0] - 1])
        } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const start = parts[0] - 1
          const end = parts[1] - 1
          const range: number[] = []
          for (let i = start; i <= end; i++) {
            range.push(i)
          }
          splits.push(range)
        }
      }
    }

    // Validate splits
    for (const split of splits) {
      if (split.some(i => i < 0 || i >= maxPage)) {
        return NextResponse.json({ error: "Invalid page range selected" }, { status: 400 })
      }
    }

    if (splits.length === 0) {
      return NextResponse.json({ error: "No valid splits provided" }, { status: 400 })
    }

    // 4. Generate the new PDFs
    const zip = new AdmZip()
    const baseName = sourceFile.originalName.replace(/\.pdf$/i, "")

    for (let i = 0; i < splits.length; i++) {
      const splitIndices = splits[i]
      const newDoc = await PDFDocument.create()
      const copiedPages = await newDoc.copyPages(sourceDoc, splitIndices)
      copiedPages.forEach(p => newDoc.addPage(p))
      
      const newBytes = await newDoc.save()
      const suffix = mode === "all" ? `page-${splitIndices[0] + 1}` : `part-${i + 1}`
      const pdfName = `${baseName}-${suffix}.pdf`
      
      zip.addFile(pdfName, Buffer.from(newBytes))
    }

    const zipBuffer = zip.toBuffer()

    // 5. Save to disk
    const processedDir = path.join(process.cwd(), "storage", "processed")
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true })
    }

    const newFileName = `${uuidv4()}.zip`
    const newStoragePath = path.join(processedDir, newFileName)
    await writeFile(newStoragePath, zipBuffer)

    // 6. Create new file record
    const finalFile = await prisma.file.create({
      data: {
        userId: session.user.id,
        fileName: newFileName,
        originalName: `split-${baseName}.zip`,
        fileSize: zipBuffer.length,
        mimeType: "application/zip",
        storagePath: newStoragePath
      }
    })

    // 7. Create Job record
    await prisma.job.create({
      data: {
        userId: session.user.id,
        fileId: finalFile.id,
        type: "SPLIT",
        status: "COMPLETED",
        progress: 100
      }
    })

    return NextResponse.json({ 
      success: true, 
      file: finalFile
    })
  } catch (error: any) {
    console.error("Split PDF Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
