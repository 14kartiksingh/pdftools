import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

export const dynamic = "force-dynamic"

// Initialize OpenAI client pointing to ChatAnywhere
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.chatanywhere.tech/v1",
});

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId, message } = await req.json()

    if (!chatId || !message) {
      return NextResponse.json({ error: "Missing chatId or message" }, { status: 400 })
    }

    // Verify chat ownership
    const chat = await prisma.aIChat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 })
    }

    // 1. Save user message to DB
    const userMsg = await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "USER",
        content: message
      }
    })

    // 2. Extract Document & Apply Sliding Window
    let systemMsg = chat.messages.find(m => m.role === "SYSTEM");
    if (!systemMsg) {
      return NextResponse.json({ error: "System message missing" }, { status: 500 })
    }

    let rawText = "";
    let systemContent = systemMsg.content;
    const fullDocMatch = systemContent.match(/<FULL_DOCUMENT>([\s\S]*?)<\/FULL_DOCUMENT>/);
    if (fullDocMatch) {
      rawText = fullDocMatch[1];
      // Strip the FULL_DOCUMENT out of the system message for the final payload
      systemContent = systemContent.replace(/<FULL_DOCUMENT>[\s\S]*?<\/FULL_DOCUMENT>/, "").trim();
    }

    // Keep System prompt + last 10 messages (5 pairs) + the current user message
    const allUserAiMessages = chat.messages.filter(m => m.role !== "SYSTEM");
    const windowedMessages = allUserAiMessages.slice(-10);
    const dbMessages = [{ ...systemMsg, content: systemContent }, ...windowedMessages, userMsg];

    let injectedContextMessage = null;

    // --- LIGHTWEIGHT KEYWORD RAG START ---
    if (rawText) {
      // 1. Split intelligently (paragraphs/headings/bullets)
      let chunks = rawText.split(/\n\n+/).map(c => c.trim()).filter(Boolean);
      if (chunks.length < 5) {
        chunks = rawText.match(/[\s\S]{1,1000}/g) || [rawText];
      }

      // 2. Extract keywords from current user message
      const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "is", "are", "am", "was", "were", "be", "this", "that", "it", "of", "how", "what", "why", "when", "who", "which", "explain", "summarize", "please", "can", "you", "tell", "me"]);
      const queryWords = message.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => !stopWords.has(w) && w.length > 2);
      
      // 3. Score chunks
      const scoredChunks = chunks.map((chunk, index) => {
        const chunkLower = chunk.toLowerCase();
        let score = 0;
        
        if (chunkLower.includes(message.toLowerCase())) score += 50;
        queryWords.forEach(kw => {
          const matches = chunkLower.split(kw).length - 1;
          score += matches * 5;
        });
        if (index < 3) score += 2; // Slight boost to intro
        
        return { index: index + 1, chunk, score }; // 1-indexed for citations
      });

      // 4. Select top chunks
      const maxTokensChars = 12000;
      let selectedChunks: string[] = [];
      let currentCharCount = 0;
      let selectedIndexes: number[] = [];
      
      const sortedByScore = [...scoredChunks].sort((a, b) => b.score - a.score);
      
      // If no relevant chunks are found (score === 0), we DO NOT send any context
      if (sortedByScore.length > 0 && sortedByScore[0].score > 0) {
        for (const sc of sortedByScore) {
          if (sc.score === 0) continue;
          if (currentCharCount + sc.chunk.length > maxTokensChars) break;
          selectedChunks.push(`[Chunk ${sc.index}]\n${sc.chunk}`);
          selectedIndexes.push(sc.index);
          currentCharCount += sc.chunk.length;
        }

        // Sort selected chunks back into document order
        const finalChunks = selectedChunks
          .map((chunk, i) => ({ chunk, index: selectedIndexes[i] }))
          .sort((a, b) => a.index - b.index);
          
        const newSystemContext = finalChunks.map(c => c.chunk).join("\n\n...\n\n");
        
        injectedContextMessage = {
          role: "SYSTEM",
          content: `--- RETRIEVED DOCUMENT CONTEXT ---\n${newSystemContext}\n----------------------------------`
        };
      }

      // 5. Retrieval Logging
      console.log(`[Retrieval Debug] Query: "${message}"`);
      console.log(`[Retrieval Debug] Extracted Keywords:`, queryWords);
      console.log(`[Retrieval Debug] Selected Chunks Indexes:`, selectedIndexes.sort((a,b)=>a-b));
      console.log(`[Retrieval Debug] Total Chunks Sent: ${selectedChunks.length} out of ${chunks.length}`);
      console.log(`[Retrieval Debug] Windowed History Sent: ${windowedMessages.length} messages`);
    }
    // --- LIGHTWEIGHT KEYWORD RAG END ---
    
    // Inject context right before the latest user message
    if (injectedContextMessage) {
      dbMessages.splice(dbMessages.length - 1, 0, injectedContextMessage);
    }

    // Map DB roles to OpenAI roles
    const openAiMessages = dbMessages.map(m => ({
      role: m.role === "USER" ? "user" : (m.role === "AI" ? "assistant" : "system"),
      content: m.content
    })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    
    const approxPayloadSize = JSON.stringify(openAiMessages).length;
    console.log(`[Retrieval Debug] Approx Total Payload Size: ${approxPayloadSize} chars (~${Math.round(approxPayloadSize/4)} tokens)`);

    // 3. Call OpenAI with streaming enabled
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: openAiMessages,
      temperature: 0.1,
      top_p: 0.9,
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        let fullText = ""
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              fullText += content
              // Send SSE formatted chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`))
            }
          }
        } catch (streamError) {
          console.error("Stream parsing error:", streamError)
          controller.error(streamError)
        } finally {
          // Send [DONE] event
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()

          // 4. Save full AI response to DB asynchronously
          if (fullText) {
            await prisma.chatMessage.create({
              data: {
                chatId: chat.id,
                role: "AI",
                content: fullText
              }
            }).catch(dbErr => console.error("Failed to save AI response:", dbErr))
          }
        }
      }
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    })
  } catch (error: any) {
    console.error("Studio GPT Chat Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
