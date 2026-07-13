"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  role: "USER" | "AI"
  content: string
}

const SUGGESTED_PROMPTS = [
  "Summarize this document",
  "Explain it in simple language",
  "Give me exam notes",
  "Generate interview questions",
  "What are the main concepts?"
]

export default function StudioGPT() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("")
  const [chatId, setChatId] = useState<string | null>(null)
  const [docTitle, setDocTitle] = useState("")
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading, streaming])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setUploadStatus("Uploading PDF...")
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploadStatus("Extracting text and preparing AI...")
      const res = await fetch("/api/tools/studio-gpt/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setChatId(data.chatId)
        setDocTitle(data.title)
        setMessages([])
      } else {
        alert(data.error || "Failed to extract text from PDF")
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred during upload")
    } finally {
      setUploading(false)
      setUploadStatus("")
    }
  }

  const sendRequest = async (messageText: string) => {
    if (!chatId) return

    // Cancel any ongoing stream
    if (abortController) {
      abortController.abort()
    }
    const newController = new AbortController()
    setAbortController(newController)

    setLoading(true)
    setStreaming(true)
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: "USER", content: messageText }])
    
    // Add empty AI message placeholder to stream into
    setMessages(prev => [...prev, { role: "AI", content: "" }])

    try {
      const res = await fetch("/api/tools/studio-gpt/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: messageText }),
        signal: newController.signal
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        alert(errorData.error || "Failed to get response")
        setMessages(prev => prev.slice(0, -1)) // Remove empty placeholder
        return
      }

      setLoading(false) // Ready to stream
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error("No reader available")

      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim()
              if (data === "[DONE]") {
                done = true
                break
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  setMessages(prev => {
                    const newMessages = [...prev]
                    const lastIndex = newMessages.length - 1
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      content: newMessages[lastIndex].content + parsed.text
                    }
                    return newMessages
                  })
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(err)
        alert("An error occurred while streaming message")
      }
    } finally {
      setLoading(false)
      setStreaming(false)
      setAbortController(null)
    }
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || !chatId || loading) return
    const userMessage = input.trim()
    setInput("")
    sendRequest(userMessage)
  }

  const handleStopGenerating = () => {
    if (abortController) {
      abortController.abort()
      setLoading(false)
      setStreaming(false)
      setAbortController(null)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // Optional: show a small toast here if desired
  }

  const handleRegenerate = () => {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "USER") {
        const lastPrompt = messages[i].content
        // Remove the old AI response if it exists, and the user message to re-append it cleanly
        setMessages(messages.slice(0, i))
        sendRequest(lastPrompt)
        break
      }
    }
  }

  const handleReplaceFile = () => {
    if (confirm("Are you sure you want to replace this document? Your current chat will be lost.")) {
      if (abortController) abortController.abort()
      setFile(null)
      setChatId(null)
      setMessages([])
      setDocTitle("")
      setAbortController(null)
      setStreaming(false)
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6">
        <h1 className="font-display-sm text-display-sm">Studio GPT</h1>
        <p className="text-on-surface-variant font-body-md mt-1">Chat naturally with your PDFs.</p>
      </div>

      {!chatId ? (
        // UPLOAD STATE
        <div className="flex-1 flex flex-col items-center justify-center bg-surface border border-outline-variant rounded-xl p-8">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-on-primary-container">psychology</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm mb-2">Welcome to Studio GPT</h2>
          <p className="text-on-surface-variant text-center max-w-md mb-8">
            Upload any PDF and ask questions, generate summaries, or extract key insights. 
            Studio GPT acts as your personal document analyst.
          </p>

          <form onSubmit={handleUpload} className="w-full max-w-md flex flex-col gap-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary hover:file:text-white transition-colors"
              required
              disabled={uploading}
            />
            
            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full bg-primary text-on-primary font-bold uppercase tracking-widest py-3 rounded hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  {uploadStatus || "Processing..."}
                </>
              ) : (
                "Start Chatting"
              )}
            </button>
          </form>
        </div>
      ) : (
        // CHAT STATE
        <div className="flex-1 flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {/* Top Bar */}
          <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="material-symbols-outlined text-primary">description</span>
              <span className="font-label-lg font-bold truncate">{docTitle}</span>
            </div>
            <button
              onClick={handleReplaceFile}
              className="text-error hover:bg-error-container hover:text-on-error-container px-3 py-1.5 rounded font-label-sm uppercase tracking-wider font-bold transition-colors text-sm whitespace-nowrap"
            >
              Replace PDF
            </button>
          </div>

          {/* Chat Canvas */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <span className="material-symbols-outlined text-4xl text-primary mb-4">waving_hand</span>
                <h3 className="font-headline-sm mb-2">Document Ready!</h3>
                <p className="text-on-surface-variant mb-6">Choose a suggestion below or type your own question.</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendRequest(prompt)}
                      className="bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-full px-4 py-2 text-sm transition-colors text-on-surface"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isLastAI = msg.role === "AI" && idx === messages.length - 1;
              return (
                <div key={idx} className={`flex flex-col ${msg.role === "USER" ? "items-end" : "items-start"}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      msg.role === "USER" 
                        ? "bg-primary text-on-primary rounded-tr-sm" 
                        : "bg-surface-container border border-outline-variant rounded-tl-sm text-on-surface"
                    }`}
                  >
                    {msg.role === "USER" ? (
                      <p className="whitespace-pre-wrap font-body-md">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions for AI Messages */}
                  {msg.role === "AI" && msg.content && (
                    <div className="flex gap-1 mt-1 ml-2">
                      <button 
                        onClick={() => handleCopy(msg.content)}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container rounded transition-colors"
                        title="Copy"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                      {isLastAI && !streaming && !loading && (
                        <button 
                          onClick={handleRegenerate}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container rounded transition-colors"
                          title="Regenerate"
                        >
                          <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-container border border-outline-variant rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                  <span className="text-sm font-medium text-on-surface-variant">Studio GPT is thinking</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-surface-container-low border-t border-outline-variant relative">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!uploading && !loading && !streaming) {
                      handleSendMessage();
                    }
                  }
                }}
                placeholder="Ask a question about your document..."
                className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-3 resize-none max-h-32 min-h-[56px] focus:outline-none focus:border-primary font-body-md"
                disabled={uploading}
                rows={1}
                style={{ height: input.split('\n').length > 1 ? `${Math.min(input.split('\n').length * 24 + 32, 128)}px` : '56px' }}
              />
              
              {streaming || loading ? (
                <button
                  type="button"
                  onClick={handleStopGenerating}
                  className="w-14 h-[56px] bg-error text-on-error rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
                  title="Stop generating"
                >
                  <span className="material-symbols-outlined">stop_circle</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() || uploading}
                  className="w-14 h-[56px] bg-primary text-on-primary rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
                  title="Send message"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              )}
            </form>
            <p className="text-center text-[10px] text-on-surface-variant mt-2 uppercase tracking-widest">
              Studio GPT can make mistakes. Check important info.
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
