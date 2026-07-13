"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function timeAgo(dateInput: any) {
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

function RelativeTime({ date }: { date: any }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <span suppressHydrationWarning>{new Date(date).toISOString().split('T')[0]}</span>
  }

  return <span>{timeAgo(date)}</span>
}

export default function RecentDocuments({ initialFiles }: { initialFiles: any[] }) {
  const router = useRouter()
  const [files, setFiles] = useState(initialFiles)
  const [fileToDelete, setFileToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!fileToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/files/${fileToDelete.id}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        throw new Error("Failed to delete file")
      }
      setFiles(files.filter(f => f.id !== fileToDelete.id))
      setFileToDelete(null)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Error deleting file")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="border border-outline-variant rounded overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-outline-variant">
            <tr>
              <th className="px-6 py-5 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest bg-surface-container-low">File Name</th>
              <th className="px-6 py-5 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right bg-surface-container-low">Size</th>
              <th className="px-6 py-5 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right bg-surface-container-low">Last Modified</th>
              <th className="px-6 py-5 bg-surface-container-low"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant bg-surface">
            {files.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-24 text-center text-on-surface-variant bg-surface-container-lowest animate-in fade-in duration-500">
                  <div className="w-16 h-16 mx-auto mb-6 bg-surface-container-high rounded-full flex items-center justify-center border border-outline-variant shadow-inner">
                    <span className="material-symbols-outlined text-3xl opacity-60">topic</span>
                  </div>
                  <h4 className="font-title-md text-title-md text-white mb-2">No documents found</h4>
                  <p className="font-body-md text-body-md max-w-sm mx-auto">Upload or merge a PDF to get started. Your recent activity will appear here.</p>
                </td>
              </tr>
            ) : (
              files.map((file: any, index: number) => (
                <tr 
                  key={file.id} 
                  className="hover:bg-surface-container transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center border border-outline-variant group-hover:bg-primary-container/20 group-hover:border-primary/30 transition-colors">
                        <span className="material-symbols-outlined text-primary text-xl">picture_as_pdf</span>
                      </div>
                      <span className="font-title-md text-title-md text-white truncate max-w-[200px] md:max-w-xs block group-hover:text-primary transition-colors" title={file.originalName}>{file.originalName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right font-mono-sm text-mono-sm text-on-surface-variant">{formatBytes(file.fileSize)}</td>
                  <td className="px-6 py-6 text-right font-mono-sm text-mono-sm text-on-surface-variant">
                    <RelativeTime date={file.createdAt} />
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                      <a href={`/api/files/${file.id}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-transparent border border-transparent rounded text-on-surface-variant hover:border-primary-container hover:text-white transition-all hover:shadow-[0_0_10px_rgba(255,106,0,0.1)]" title="View">
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </a>
                      <a href={`/api/files/${file.id}?action=download`} className="p-2.5 bg-transparent border border-transparent rounded text-on-surface-variant hover:border-primary-container hover:text-white transition-all hover:shadow-[0_0_10px_rgba(255,106,0,0.1)]" title="Download">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </a>
                      <button onClick={() => setFileToDelete(file)} className="p-2.5 bg-transparent border border-transparent rounded text-on-surface-variant hover:border-error hover:text-error hover:bg-error-container transition-all hover:shadow-[0_0_10px_rgba(255,0,0,0.1)]" title="Delete">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container p-8 rounded border border-outline-variant max-w-md w-full animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="font-display-lg text-[24px] leading-tight text-white mb-2">Delete PDF?</h3>
            <p className="text-on-surface-variant font-body-lg mb-8">
              Are you sure you want to permanently delete <strong className="text-white">{fileToDelete.originalName}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-4">
              <button 
                onClick={() => setFileToDelete(null)}
                disabled={deleting}
                className="px-6 py-3 rounded font-label-md uppercase tracking-widest text-on-surface border border-outline-variant hover:border-primary-container hover:bg-surface-container-high hover:text-white transition-all duration-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-3 rounded font-label-md uppercase tracking-widest bg-gradient-to-b from-error to-error-container text-white border border-error hover:brightness-110 transition-all duration-300 disabled:opacity-50 flex items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
