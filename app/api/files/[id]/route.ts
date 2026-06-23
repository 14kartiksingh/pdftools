import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { readFile, unlink } from "fs/promises"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")

    const file = await prisma.file.findUnique({
      where: { id }
    })

    if (!file || file.userId !== session.user.id) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const fileBuffer = await readFile(file.storagePath)

    const headers = new Headers()
    headers.set("Content-Type", file.mimeType || "application/pdf")
    
    if (action === "download") {
      headers.set("Content-Disposition", `attachment; filename="${file.originalName}"`)
    } else {
      headers.set("Content-Disposition", `inline; filename="${file.originalName}"`)
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error("GET File Error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const file = await prisma.file.findUnique({
      where: { id }
    })

    if (!file || file.userId !== session.user.id) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 })
    }

    // Delete from DB first
    await prisma.file.delete({
      where: { id }
    })

    // Try deleting physical file
    try {
      await unlink(file.storagePath)
    } catch (e) {
      console.error("Failed to delete physical file:", file.storagePath, e)
      // We still return success since DB record is gone, but log the physical error
    }

    return NextResponse.json({ success: true, message: "File deleted successfully" })
  } catch (error) {
    console.error("DELETE File Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
