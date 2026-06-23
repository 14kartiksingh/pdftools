"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function MergePdfPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState("")
  const [mergedFile, setMergedFile] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.")
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
      setMerging(true)

      const fileIds = uploadData.files.map((f: any) => f.id)

      // 2. Merge files
      const mergeRes = await fetch("/api/tools/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds })
      })

      const mergeData = await mergeRes.json()

      if (!mergeRes.ok) {
        throw new Error(mergeData.error || "Merge failed")
      }

      setMergedFile(mergeData.file)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setUploading(false)
      setMerging(false)
    } finally {
      setUploading(false)
      setMerging(false)
    }
  }

  const handleReset = () => {
    setFiles([])
    setMergedFile(null)
    setError("")
  }

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-8">
      <Link href="/" className="inline-flex items-center text-primary font-bold uppercase text-label-md mb-8 hover:underline">
        <span className="material-symbols-outlined mr-2">arrow_back</span>
        Back to Dashboard
      </Link>

      <div className="bg-surface-container p-8 rounded-xl border border-outline-variant max-w-3xl mx-auto">
        {mergedFile ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h1 className="font-display-lg text-display-lg mb-2">PDFs Merged Successfully!</h1>
            <p className="text-on-surface-variant font-body-md mb-8">Your new document is ready.</p>
            
            <div className="bg-surface border border-outline-variant rounded p-4 mb-8 max-w-md mx-auto text-left flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="material-symbols-outlined text-primary-container text-3xl">picture_as_pdf</span>
                <div className="truncate">
                  <p className="font-body-md text-on-surface truncate font-medium">{mergedFile.originalName}</p>
                  <p className="font-mono-sm text-on-surface-variant">{(mergedFile.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <a 
                href={`/api/files/${mergedFile.id}?action=download`}
                className="w-full bg-primary-container text-on-primary-container font-bold uppercase tracking-wider p-3 rounded hover:brightness-110 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined mr-2">download</span>
                Download
              </a>
              <a 
                href={`/api/files/${mergedFile.id}`}
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
              Merge More PDFs
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">call_merge</span>
              </div>
              <h1 className="font-display-lg text-display-lg">Merge PDFs</h1>
              <p className="text-on-surface-variant font-body-md mt-2">Combine multiple PDFs into a single document.</p>
            </div>

            {error && <div className="bg-error-container text-on-error-container p-4 rounded mb-6 text-center font-bold">{error}</div>}

            <div className="border-2 border-dashed border-outline-variant rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer relative bg-surface">
              <input 
                type="file" 
                multiple 
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">upload_file</span>
              <p className="font-body-lg text-body-lg text-on-surface mb-2">Drag & drop PDFs here</p>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase">or click to browse</p>
            </div>

            {files.length > 0 && (
              <div className="mt-8">
                <h3 className="font-label-md text-label-md uppercase font-bold text-on-surface-variant mb-4">Selected Files ({files.length})</h3>
                <ul className="space-y-2 mb-8">
                  {files.map((file, i) => (
                    <li key={i} className="flex items-center justify-between p-3 bg-surface border border-outline-variant rounded">
                      <span className="font-body-md truncate mr-4">{file.name}</span>
                      <span className="font-mono-sm text-on-surface-variant whitespace-nowrap">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={handleMerge}
                  disabled={uploading || merging}
                  className="w-full bg-primary-container text-on-primary-container p-4 rounded font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : merging ? "Merging..." : "Merge PDFs"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
