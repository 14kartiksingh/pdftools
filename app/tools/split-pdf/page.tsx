"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function SplitPdfPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<"all" | "custom">("all")
  const [customRangeStr, setCustomRangeStr] = useState("")
  const [uploading, setUploading] = useState(false)
  const [splitting, setSplitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSplit = async () => {
    if (!file) {
      setError("Please select a PDF file.")
      return
    }

    let parsedRanges: string[] = []
    if (mode === "custom") {
      parsedRanges = customRangeStr.split(",").map(s => s.trim()).filter(s => s.length > 0)
      if (parsedRanges.length === 0) {
        setError("Please enter valid page ranges (e.g., 1-3, 5, 7-9).")
        return
      }
    }

    setError("")
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("files", file)

      // 1. Upload file
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload failed")
      }

      setUploading(false)
      setSplitting(true)

      const fileId = uploadData.files[0].id

      // 2. Split file
      const splitRes = await fetch("/api/tools/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileId, 
          mode,
          ranges: mode === "custom" ? parsedRanges : undefined
        })
      })

      const splitData = await splitRes.json()

      if (!splitRes.ok) {
        throw new Error(splitData.error || "Split operation failed")
      }

      setResult(splitData.file)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setSplitting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setMode("all")
    setCustomRangeStr("")
    setResult(null)
    setError("")
  }

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-8">
      <Link href="/" className="inline-flex items-center text-primary font-bold uppercase text-label-md mb-8 hover:underline">
        <span className="material-symbols-outlined mr-2">arrow_back</span>
        Back to Dashboard
      </Link>

      <div className="bg-surface-container p-8 rounded-xl border border-outline-variant max-w-4xl mx-auto">
        {result ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h1 className="font-display-lg text-display-lg mb-2">PDF Split Successfully!</h1>
            <p className="text-on-surface-variant font-body-md mb-8">Your ZIP archive containing the split PDFs is ready.</p>
            
            <div className="bg-surface border border-outline-variant rounded p-4 mb-8 max-w-md mx-auto text-left flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="material-symbols-outlined text-primary-container text-3xl">folder_zip</span>
                <div className="truncate">
                  <p className="font-body-md text-on-surface truncate font-medium">{result.originalName}</p>
                  <p className="font-mono-sm text-on-surface-variant">{(result.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <a 
                href={`/api/files/${result.id}?action=download`}
                className="w-full bg-primary-container text-on-primary-container font-bold uppercase tracking-wider p-3 rounded hover:brightness-110 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined mr-2">download</span>
                Download ZIP
              </a>
              <Link 
                href="/"
                className="w-full bg-surface border border-outline-variant text-on-surface font-bold uppercase tracking-wider p-3 rounded hover:bg-surface-variant transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined mr-2">dashboard</span>
                Dashboard
              </Link>
            </div>
            <button onClick={handleReset} className="mt-8 text-on-surface-variant hover:text-primary font-label-md uppercase font-bold tracking-widest text-sm underline transition-colors">
              Split Another PDF
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">cut</span>
              </div>
              <h1 className="font-display-lg text-display-lg">Split PDF</h1>
              <p className="text-on-surface-variant font-body-md mt-2">Separate one page or a whole set for easy conversion into independent PDF files.</p>
            </div>

            {error && <div className="bg-error-container text-on-error-container p-4 rounded mb-6 text-center font-bold">{error}</div>}

            {!file ? (
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer relative bg-surface">
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">upload_file</span>
                <p className="font-body-lg text-body-lg text-on-surface mb-2">Drag & drop a PDF here</p>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase">or click to browse</p>
              </div>
            ) : (
              <div className="mt-8">
                <div className="flex items-center justify-between p-3 bg-surface border border-outline-variant rounded mb-8">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">picture_as_pdf</span>
                    <span className="font-body-md truncate">{file.name}</span>
                  </div>
                  <button onClick={() => setFile(null)} className="text-error hover:underline text-sm font-bold uppercase">Change File</button>
                </div>

                <div className="mb-8 bg-surface border border-outline-variant rounded p-6">
                  <h3 className="font-label-md text-label-md uppercase font-bold text-on-surface-variant mb-4">Split Options</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="splitMode" 
                        value="all" 
                        checked={mode === "all"} 
                        onChange={() => setMode("all")}
                        className="w-5 h-5 text-primary border-outline-variant focus:ring-primary"
                      />
                      <span className="font-body-md text-on-surface">Extract every page into a separate PDF</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="splitMode" 
                        value="custom" 
                        checked={mode === "custom"} 
                        onChange={() => setMode("custom")}
                        className="w-5 h-5 text-primary border-outline-variant focus:ring-primary"
                      />
                      <span className="font-body-md text-on-surface">Custom page ranges</span>
                    </label>

                    {mode === "custom" && (
                      <div className="ml-8 mt-2">
                        <input 
                          type="text" 
                          value={customRangeStr}
                          onChange={(e) => setCustomRangeStr(e.target.value)}
                          placeholder="e.g., 1-3, 5, 7-9"
                          className="w-full bg-surface-container-low border border-outline-variant rounded p-3 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono"
                        />
                        <p className="text-on-surface-variant font-body-sm mt-2">Separate ranges with commas. A new PDF will be created for each range.</p>
                      </div>
                    )}
                  </div>
                </div>



                <button 
                  onClick={handleSplit}
                  disabled={uploading || splitting || (mode === "custom" && customRangeStr.trim() === "")}
                  className="w-full bg-primary-container text-on-primary-container p-4 rounded font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 mt-8"
                >
                  {uploading ? "Uploading..." : splitting ? "Splitting..." : "Split PDF"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
