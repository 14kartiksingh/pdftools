import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  console.log("[Studio GPT Upload] Request received")
  try {
    const session = await auth()
    if (!session || !session.user) {
      console.log("[Studio GPT Upload] Unauthorized access attempt")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    console.log("[Studio GPT Upload] Session validated for user:", session.user.id)

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[Studio GPT Upload] No file found in request")
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }
    console.log(`[Studio GPT Upload] PDF uploaded: ${file.name} (${file.size} bytes)`)

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log("[Studio GPT Upload] Buffer loaded successfully")

    console.log("[Studio GPT Upload] Text extraction started using pdf2json")
    
    // We dynamically require pdf2json inside the try-catch to absolutely prevent module-evaluation crashes
    const PDFParser = require("pdf2json")
    
    const extractedText = await new Promise<string>((resolve, reject) => {
      // 1 means text-only extraction
      const pdfParser = new PDFParser(null, 1);
      
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error("[Studio GPT Upload] pdf2json error:", errData.parserError);
        reject(errData.parserError);
      });
      
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });
      
      pdfParser.parseBuffer(buffer);
    });

    console.log(`[Studio GPT Upload] Text extraction completed. Extracted ${extractedText.length} characters.`)

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ success: false, error: "No readable text found in PDF" }, { status: 400 })
    }

    // Limit text length to prevent massive token usage
    const cappedText = extractedText.substring(0, 100000);

    console.log("[Studio GPT Upload] Creating AIChat in database")
    const chat = await prisma.aIChat.create({
      data: {
        userId: session.user.id as string,
        title: file.name || "Document Chat",
      }
    })

    console.log("[Studio GPT Upload] Inserting extracted text as SYSTEM ChatMessage")
    const systemPrompt = `You are Studio GPT, a highly intelligent and helpful document analysis assistant. Your primary goal is to answer the user's questions strictly using the provided context from their uploaded document.

CRITICAL INSTRUCTIONS:
1. ALWAYS base your answers entirely on the document context provided in the conversation.
2. If the user asks for information not present in the document, you MUST clearly state: "I cannot find this information in the document." Do NOT hallucinate or use outside knowledge.
3. Use Markdown formatting for your responses. Use headings (##), bullet points (-), numbered lists (1.), bold text (**bold**), and tables where appropriate to make your answers easy to read and well-structured.
4. **CITE YOUR SOURCES**: Whenever you provide a fact from the document, you MUST append a citation using the chunk number provided in the context. Example: "The revenue grew by 20% (Source: Chunk 12)". Do not hallucinate citations.
5. If asked to summarize, provide a concise but comprehensive overview with bullet points.
6. If the user provides a vague prompt (e.g., "explain"), explain the key themes of the document in a structured, conversational tone.
7. If asked for code, use markdown code blocks with syntax highlighting.

<FULL_DOCUMENT>
${cappedText}
</FULL_DOCUMENT>
`;

    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "SYSTEM",
        content: systemPrompt
      }
    })

    console.log("[Studio GPT Upload] Response sent successfully")
    return NextResponse.json({ success: true, chatId: chat.id, title: chat.title })
  } catch (error: any) {
    console.error("[Studio GPT Upload] FATAL ERROR:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to process PDF" 
    }, { status: 500 })
  }
}


