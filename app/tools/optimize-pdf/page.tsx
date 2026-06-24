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

export default function OptimizePdfPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleOptimize = async () => {
    if (!file) {
      setError("Please select a PDF file to optimize.")
      return
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
      setOptimizing(true)

      const fileId = uploadData.files[0].id

      // 2. Optimize file
      const optimizeRes = await fetch("/api/tools/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId })
      })

      const optimizeData = await optimizeRes.json()

      if (!optimizeRes.ok) {
        throw new Error(optimizeData.error || "Optimization failed")
      }

      setResult(optimizeData)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setOptimizing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setError("")
  }

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-8">
      <Link href="/" className="inline-flex items-center text-primary font-bold uppercase text-label-md mb-8 hover:underline">
        <span className="material-symbols-outlined mr-2">arrow_back</span>
        Back to Dashboard
      </Link>

      <div className="bg-surface-container p-8 rounded-xl border border-outline-variant max-w-3xl mx-auto">
        {result ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h1 className="font-display-lg text-display-lg mb-2">Structure Optimized Successfully!</h1>
            <p className="text-on-surface-variant font-body-md mb-8">Your document has been rebuilt with optimized object streams.</p>
            
            <div className="bg-surface border border-outline-variant rounded p-4 mb-8 max-w-md mx-auto text-left flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden w-full">
                <span className="material-symbols-outlined text-primary-container text-3xl">picture_as_pdf</span>
                <div className="truncate flex-1">
                  <p className="font-body-md text-on-surface truncate font-medium">{result.file.originalName}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-mono-sm text-on-surface-variant line-through">{formatBytes(result.originalSize)}</span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">arrow_forward</span>
                    <span className="font-mono-sm text-primary font-bold">{formatBytes(result.newSize)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <a 
                href={`/api/files/${result.file.id}?action=download`}
                className="w-full bg-primary-container text-on-primary-container font-bold uppercase tracking-wider p-3 rounded hover:brightness-110 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined mr-2">download</span>
                Download
              </a>
              <a 
                href={`/api/files/${result.file.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-surface border border-outline-variant text-on-surface font-bold uppercase tracking-wider p-3 rounded hover:bg-surface-variant transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined mr-2">visibility</span>
                View / Open
              </a>
              <Link 
                href="/"
                className="w-full md:col-span-2 bg-transparent text-primary border border-primary font-bold uppercase tracking-wider p-3 rounded hover:bg-primary/10 transition-all flex items-center justify-center mt-2"
              >
                <span className="material-symbols-outlined mr-2">dashboard</span>
                Back to Dashboard
              </Link>
            </div>
            <button onClick={handleReset} className="mt-8 text-on-surface-variant hover:text-primary font-label-md uppercase font-bold tracking-widest text-sm underline transition-colors">
              Optimize Another PDF
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">compress</span>
              </div>
              <h1 className="font-display-lg text-display-lg">Optimize PDF Structure</h1>
              <p className="text-on-surface-variant font-body-md mt-2">Rebuild internal PDF objects and streams for maximum structural compatibility.</p>
            </div>

            {error && <div className="bg-error-container text-on-error-container p-4 rounded mb-6 text-center font-bold">{error}</div>}

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

            {file && (
              <div className="mt-8">
                <h3 className="font-label-md text-label-md uppercase font-bold text-on-surface-variant mb-4">Selected File</h3>
                <div className="flex items-center justify-between p-3 bg-surface border border-outline-variant rounded mb-8">
                  <span className="font-body-md truncate mr-4">{file.name}</span>
                  <span className="font-mono-sm text-on-surface-variant whitespace-nowrap">{formatBytes(file.size)}</span>
                </div>

                <button 
                  onClick={handleOptimize}
                  disabled={uploading || optimizing}
                  className="w-full bg-primary-container text-on-primary-container p-4 rounded font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : optimizing ? "Optimizing..." : "Optimize PDF"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
