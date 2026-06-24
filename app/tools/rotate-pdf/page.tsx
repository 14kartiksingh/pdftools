"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PdfPageSelector from "../../components/PdfPageSelector"

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function RotatePdfPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [angle, setAngle] = useState<number>(90)
  const [uploading, setUploading] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setSelectedPages([])
    }
  }

  const handleRotate = async () => {
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
      setRotating(true)

      const fileId = uploadData.files[0].id

      // 2. Rotate pages
      const rotateRes = await fetch("/api/tools/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileId, 
          pages: selectedPages.length > 0 ? selectedPages : undefined, // undefined means all pages
          angle 
        })
      })

      const rotateData = await rotateRes.json()

      if (!rotateRes.ok) {
        throw new Error(rotateData.error || "Rotate operation failed")
      }

      setResult(rotateData.file)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setRotating(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setSelectedPages([])
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
            <h1 className="font-display-lg text-display-lg mb-2">PDF Rotated Successfully!</h1>
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
              Rotate Another PDF
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">rotate_right</span>
              </div>
              <h1 className="font-display-lg text-display-lg">Rotate PDF</h1>
              <p className="text-on-surface-variant font-body-md mt-2">Rotate all or specific pages in your document.</p>
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
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-3 bg-surface border border-outline-variant rounded mb-8">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">picture_as_pdf</span>
                    <span className="font-body-md truncate">{file.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 border border-outline-variant rounded p-1 bg-surface-container-low">
                    <button 
                      onClick={() => setAngle(90)} 
                      className={`px-3 py-1 text-label-sm font-bold uppercase rounded transition-colors ${angle === 90 ? 'bg-primary text-on-primary' : 'hover:bg-surface-variant'}`}
                    >
                      90°
                    </button>
                    <button 
                      onClick={() => setAngle(180)} 
                      className={`px-3 py-1 text-label-sm font-bold uppercase rounded transition-colors ${angle === 180 ? 'bg-primary text-on-primary' : 'hover:bg-surface-variant'}`}
                    >
                      180°
                    </button>
                    <button 
                      onClick={() => setAngle(270)} 
                      className={`px-3 py-1 text-label-sm font-bold uppercase rounded transition-colors ${angle === 270 ? 'bg-primary text-on-primary' : 'hover:bg-surface-variant'}`}
                    >
                      270°
                    </button>
                  </div>
                </div>

                <PdfPageSelector 
                  file={file} 
                  selectedPages={selectedPages} 
                  onSelectionChange={setSelectedPages} 
                  selectionMode="multiple" 
                />

                <button 
                  onClick={handleRotate}
                  disabled={uploading || rotating}
                  className="w-full bg-primary-container text-on-primary-container p-4 rounded font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 mt-8"
                >
                  {uploading ? "Uploading..." : rotating ? "Rotating..." : selectedPages.length > 0 ? `Rotate ${selectedPages.length} Pages` : "Rotate All Pages"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
