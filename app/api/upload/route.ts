import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import path from "path"
import { writeFile } from "fs/promises"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const originalName = file.name
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const storagePath = path.join(process.cwd(), "storage", "uploads", fileName)

      await writeFile(storagePath, buffer)

      const dbFile = await prisma.file.create({
        data: {
          userId: session.user.id as string,
          fileName,
          originalName,
          fileSize: file.size,
          mimeType: file.type || "application/pdf",
          storagePath,
        }
      })

      uploadedFiles.push(dbFile)
    }

    return NextResponse.json({ success: true, files: uploadedFiles })
  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
