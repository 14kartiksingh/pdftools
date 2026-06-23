"use client"

import { useState } from "react"
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
      <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">File Name</th>
              <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Size</th>
              <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Last Modified</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {files.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">No documents yet. Upload or merge a PDF to get started.</td>
              </tr>
            ) : (
              files.map((file: any) => (
                <tr key={file.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary-container">picture_as_pdf</span>
                      <span className="font-body-md text-body-md font-medium truncate max-w-xs block" title={file.originalName}>{file.originalName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono-sm text-mono-sm text-on-surface-variant">{formatBytes(file.fileSize)}</td>
                  <td className="px-6 py-4 text-right font-body-md text-body-md text-on-surface-variant">{timeAgo(file.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <a href={`/api/files/${file.id}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-primary transition-colors" title="View">
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </a>
                      <a href={`/api/files/${file.id}?action=download`} className="p-2 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-primary transition-colors" title="Download">
                        <span className="material-symbols-outlined text-xl">download</span>
                      </a>
                      <button onClick={() => setFileToDelete(file)} className="p-2 hover:bg-error-container rounded text-on-surface-variant hover:text-on-error-container transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-xl">delete</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-title-lg text-title-lg mb-2">Delete PDF?</h3>
            <p className="text-on-surface-variant font-body-md mb-6">
              Are you sure you want to permanently delete <strong className="text-on-surface">{fileToDelete.originalName}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setFileToDelete(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded font-label-md font-bold uppercase tracking-wider text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded font-label-md font-bold uppercase tracking-wider bg-error text-on-error hover:brightness-110 transition-all disabled:opacity-50 flex items-center"
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
