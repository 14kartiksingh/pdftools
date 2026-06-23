import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { PDFDocument } from "pdf-lib"
import { readFile, writeFile } from "fs/promises"
import path from "path"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileIds } = await req.json()

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length < 2) {
      return NextResponse.json({ error: "Need at least two files to merge" }, { status: 400 })
    }

    // Fetch the files from DB
    const filesToMerge = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId: session.user.id
      }
    })

    if (filesToMerge.length !== fileIds.length) {
      return NextResponse.json({ error: "Some files were not found or unauthorized" }, { status: 404 })
    }

    // Order the files exactly as provided in the request
    const orderedFiles = fileIds.map(id => filesToMerge.find((f: any) => f.id === id)!)

    const mergedPdf = await PDFDocument.create()

    for (const dbFile of orderedFiles) {
      const pdfBytes = await readFile(dbFile.storagePath)
      const pdfDoc = await PDFDocument.load(pdfBytes)
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
      copiedPages.forEach((page) => mergedPdf.addPage(page))
    }

    const mergedPdfBytes = await mergedPdf.save()

    const originalName = `Merged_${Date.now()}.pdf`
    const fileName = `${Date.now()}-merged-${Math.random().toString(36).substring(7)}.pdf`
    const storagePath = path.join(process.cwd(), "storage", "processed", fileName)

    await writeFile(storagePath, mergedPdfBytes)

    const dbFile = await prisma.file.create({
      data: {
        userId: session.user.id as string,
        fileName,
        originalName,
        fileSize: mergedPdfBytes.length,
        mimeType: "application/pdf",
        storagePath,
      }
    })

    await prisma.job.create({
      data: {
        userId: session.user.id as string,
        fileId: dbFile.id,
        type: "MERGE",
        status: "COMPLETED",
        progress: 100,
        result: JSON.stringify({ fileId: dbFile.id })
      }
    })

    return NextResponse.json({ success: true, file: dbFile })
  } catch (error) {
    console.error("Merge PDF Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
