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

export default function PageNumbersPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  
  const [position, setPosition] = useState("BOTTOM_CENTER")

  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handlePageNumbers = async () => {
    if (!file) {
      setError("Please select a PDF file.")
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
      setProcessing(true)

      const fileId = uploadData.files[0].id

      // 2. Add page numbers
      const processRes = await fetch("/api/tools/page-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileId, 
          position
        })
      })

      const processData = await processRes.json()

      if (!processRes.ok) {
        throw new Error(processData.error || "Process failed")
      }

      setResult(processData.file)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setProcessing(false)
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

      <div className="bg-surface-container p-8 rounded-xl border border-outline-variant max-w-4xl mx-auto">
        {result ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h1 className="font-display-lg text-display-lg mb-2">Page Numbers Added Successfully!</h1>
            <p className="text-on-surface-variant font-body-md mb-8">Your new document is ready.</p>
            
            <div className="bg-surface border border-outline-variant rounded p-4 mb-8 max-w-md mx-auto text-left flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="material-symbols-outlined text-primary-container text-3xl">picture_as_pdf</span>
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
                Download
              </a>
              <a 
                href={`/api/files/${result.id}`}
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
              Process Another PDF
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">format_list_numbered</span>
              </div>
              <h1 className="font-display-lg text-display-lg">Add Page Numbers</h1>
              <p className="text-on-surface-variant font-body-md mt-2">Easily add page numbers to your document.</p>
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

                <div className="bg-surface border border-outline-variant rounded-xl p-6 mb-8 space-y-6">
                  <div>
                    <label className="block text-label-md font-bold uppercase mb-2 text-on-surface-variant">Position</label>
                    <select 
                      value={position}
                      onChange={e => setPosition(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant rounded p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="BOTTOM_CENTER">Bottom Center</option>
                      <option value="BOTTOM_RIGHT">Bottom Right</option>
                      <option value="BOTTOM_LEFT">Bottom Left</option>
                      <option value="TOP_CENTER">Top Center</option>
                      <option value="TOP_RIGHT">Top Right</option>
                      <option value="TOP_LEFT">Top Left</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handlePageNumbers}
                  disabled={uploading || processing}
                  className="w-full bg-primary-container text-on-primary-container p-4 rounded font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : processing ? "Processing..." : `Add Page Numbers`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
