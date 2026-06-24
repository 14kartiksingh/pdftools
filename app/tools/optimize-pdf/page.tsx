"use client"

import { useState, useEffect } from "react"
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

type CompressionLevel = "Basic" | "Strong" | "Extreme"

export default function OptimizePdfPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<CompressionLevel>("Basic")
  const [uploading, setUploading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleOptimize = async () => {
    if (!file) {
      setError("Please select a PDF file to compress.")
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
      setProgress(0)

      const fileId = uploadData.files[0].id

      // 2. Dispatch job
      const optimizeRes = await fetch("/api/tools/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, level })
      })

      const optimizeData = await optimizeRes.json()

      if (!optimizeRes.ok) {
        throw new Error(optimizeData.error || "Job dispatch failed")
      }

      setJobId(optimizeData.jobId)
    } catch (err: any) {
      setError(err.message)
      setUploading(false)
      setOptimizing(false)
    }
  }

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Polling failed");

        setProgress(data.progress || 0);

        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          setResult({
            file: data.file,
            originalSize: file?.size || 0,
            newSize: data.result.newSize
          });
          setOptimizing(false);
          setJobId(null);
          router.refresh();
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          setError(data.error || "Job failed during processing");
          setOptimizing(false);
          setJobId(null);
        }
      } catch (err: any) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, file, router]);

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setError("")
    setLevel("Basic")
    setJobId(null)
    setProgress(0)
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
            <h1 className="font-display-lg text-display-lg mb-2">PDF Compressed Successfully!</h1>
            <p className="text-on-surface-variant font-body-md mb-8">Your document has been optimized.</p>
            
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
              Compress Another PDF
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">compress</span>
              </div>
              <h1 className="font-display-lg text-display-lg">Compress PDF</h1>
              <p className="text-on-surface-variant font-body-md mt-2">Reduce file size using true Ghostscript compression.</p>
            </div>

            {error && <div className="bg-error-container text-on-error-container p-4 rounded mb-6 text-center font-bold">{error}</div>}

            <div className="border-2 border-dashed border-outline-variant rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer relative bg-surface">
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading || optimizing}
              />
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">upload_file</span>
              <p className="font-body-lg text-body-lg text-on-surface mb-2">Drag & drop a PDF here</p>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase">or click to browse</p>
            </div>

            {file && (
              <div className="mt-8">
                <h3 className="font-label-md text-label-md uppercase font-bold text-on-surface-variant mb-4">Compression Level</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {(['Basic', 'Strong', 'Extreme'] as CompressionLevel[]).map(l => (
                    <label key={l} className={`cursor-pointer p-4 border rounded-lg flex flex-col items-center text-center transition-all ${level === l ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-outline-variant bg-surface hover:border-outline'}`}>
                      <input 
                        type="radio" 
                        name="level" 
                        value={l} 
                        checked={level === l} 
                        onChange={(e) => setLevel(e.target.value as CompressionLevel)}
                        className="sr-only"
                        disabled={uploading || optimizing}
                      />
                      <span className="font-title-md text-title-md font-bold mb-3">{l}</span>
                      <div className="flex flex-col gap-1.5 font-body-sm text-sm text-on-surface-variant">
                        {l === 'Basic' && (
                          <>
                            <span className="flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[16px]">data_usage</span> 10–30% reduction</span>
                            <span className="flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[16px]">timer</span> &lt;30 sec</span>
                            <span className="flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[16px]">high_quality</span> Highest quality</span>
                          </>
                        )}
                        {l === 'Strong' && (
                          <>
                            <span className="flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[16px]">data_usage</span> 30–60% reduction</span>
                            <span className="flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[16px]">timer</span> 30–60 sec</span>
                            <span className="flex items-center justify-center gap-1 text-primary font-medium"><span className="material-symbols-outlined text-[16px]">star</span> Recommended</span>
                          </>
                        )}
                        {l === 'Extreme' && (
                          <>
                            <span className="flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[16px]">data_usage</span> 50–90% reduction</span>
                            <span className="flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[16px]">timer</span> 1–3 min</span>
                            <span className="flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[16px]">image</span> Lower image quality</span>
                          </>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex flex-col p-4 bg-surface border border-outline-variant rounded mb-8">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-outline-variant/50">
                    <span className="font-body-md truncate mr-4 font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-container">description</span>
                      {file.name}
                    </span>
                    <span className="font-mono-sm text-on-surface-variant whitespace-nowrap">{formatBytes(file.size)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">query_stats</span>
                      Estimated Output Size:
                    </span>
                    <span className="font-mono-sm text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">
                      {level === 'Basic' && `~${formatBytes(file.size * 0.8)}`}
                      {level === 'Strong' && `~${formatBytes(file.size * 0.55)}`}
                      {level === 'Extreme' && `~${formatBytes(file.size * 0.3)}`}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleOptimize}
                  disabled={uploading || optimizing}
                  className="relative w-full bg-primary-container text-on-primary-container p-4 rounded font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 overflow-hidden"
                >
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                  <span className="relative z-10">
                    {uploading ? "Uploading..." : optimizing ? `Compressing (${progress}%)...` : "Compress PDF"}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
