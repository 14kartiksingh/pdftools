"use client"

import { useState } from "react"
import Link from "next/link"

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function ImageToPdfPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setFiles((prev) => {
        const newFiles = [...prev];
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        return newFiles;
      });
    } else if (direction === 'down' && index < files.length - 1) {
      setFiles((prev) => {
        const newFiles = [...prev];
        [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        return newFiles;
      });
    }
  }

  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Please select at least one image file.")
      return
    }

    setError("")
    setUploading(true)

    try {
      const formData = new FormData()
      files.forEach(f => formData.append("files", f))

      // 1. Upload files
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

      const fileIds = uploadData.files.map((f: any) => f.id)

      // 2. Convert to PDF
      const convertRes = await fetch("/api/tools/image-to-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds })
      })

      const convertData = await convertRes.json()

      if (!convertRes.ok) {
        throw new Error(convertData.error || "Conversion failed")
      }

      setResult(convertData.file)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setFiles([])
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
            <h1 className="font-display-lg text-display-lg mb-2">Images Converted Successfully!</h1>
            <p className="text-on-surface-variant font-body-md mb-8">Your images have been combined into a single PDF document.</p>
            
            <div className="bg-surface border border-outline-variant rounded p-4 mb-8 max-w-md mx-auto text-left flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden w-full">
                <span className="material-symbols-outlined text-primary-container text-3xl">picture_as_pdf</span>
                <div className="truncate flex-1">
                  <p className="font-body-md text-on-surface truncate font-medium">{result.originalName}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-mono-sm text-on-surface-variant text-xs">PDF Document</span>
                    <span className="font-mono-sm text-primary font-bold">{formatBytes(result.fileSize)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <a 
                href={`/api/files/${result.id}?action=download`}
                className="w-full bg-primary-container text-on-primary-container font-bold uppercase tracking-wider p-3 rounded hover:brightness-110 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined mr-2">download</span>
                Download PDF
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
                Dashboard
              </Link>
            </div>
            <button onClick={handleReset} className="mt-8 text-on-surface-variant hover:text-primary font-label-md uppercase font-bold tracking-widest text-sm underline transition-colors">
              Convert More Images
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">collections</span>
              </div>
              <h1 className="font-display-lg text-display-lg">Image to PDF</h1>
              <p className="text-on-surface-variant font-body-md mt-2">Combine multiple JPG or PNG images into a single PDF document.</p>
            </div>

            {error && <div className="bg-error-container text-on-error-container p-4 rounded mb-6 text-center font-bold">{error}</div>}

            <div className="border-2 border-dashed border-outline-variant rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer relative bg-surface">
              <input 
                type="file" 
                accept="image/jpeg,image/png"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading || processing}
              />
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">add_photo_alternate</span>
              <p className="font-body-lg text-body-lg text-on-surface mb-2">Drag & drop images here</p>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase">or click to browse</p>
            </div>

            {files.length > 0 && (
              <div className="mt-8">
                <h3 className="font-label-md text-label-md uppercase font-bold text-on-surface-variant mb-4">Selected Images ({files.length})</h3>
                <div className="flex flex-col gap-2 mb-8">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-surface border border-outline-variant rounded group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="material-symbols-outlined text-on-surface-variant">image</span>
                        <div className="flex flex-col">
                           <span className="font-body-md truncate">{f.name}</span>
                           <span className="font-mono-sm text-on-surface-variant text-xs">{formatBytes(f.size)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveFile(i, 'up')} disabled={i === 0} className="p-1 hover:bg-surface-variant rounded disabled:opacity-30">
                          <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                        </button>
                        <button onClick={() => moveFile(i, 'down')} disabled={i === files.length - 1} className="p-1 hover:bg-surface-variant rounded disabled:opacity-30">
                          <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                        </button>
                        <button onClick={() => removeFile(i)} className="p-1 hover:bg-error-container hover:text-on-error-container rounded ml-2">
                          <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleConvert}
                  disabled={uploading || processing}
                  className="w-full bg-primary-container text-on-primary-container p-4 rounded font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {uploading ? "Uploading Images..." : processing ? "Converting to PDF..." : "Convert to PDF"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
