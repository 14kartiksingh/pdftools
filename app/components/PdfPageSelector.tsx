"use client"

import { useEffect, useState, useRef } from "react"

interface PdfPageSelectorProps {
  file: File | null
  selectedPages: number[]
  onSelectionChange: (pages: number[]) => void
  selectionMode?: "multiple" | "single" | "reorder"
}

export default function PdfPageSelector({ file, selectedPages, onSelectionChange, selectionMode = "multiple" }: PdfPageSelectorProps) {
  const [pages, setPages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!file) {
      setPages([])
      return
    }

    let isMounted = true

    const loadPdf = async () => {
      setLoading(true)
      setError("")
      try {
        const pdfjsLib = await import("pdfjs-dist")
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
        }
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        
        const numPages = pdf.numPages
        const newPages: string[] = []

        // Render each page to a data URL
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 1.0 })
          
          // Use a smaller scale for thumbnails to save memory
          const scale = 300 / viewport.width
          const thumbViewport = page.getViewport({ scale })
          
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")
          
          if (!context) continue

          canvas.height = thumbViewport.height
          canvas.width = thumbViewport.width

          await page.render({
            canvasContext: context,
            viewport: thumbViewport
          }).promise

          newPages.push(canvas.toDataURL("image/jpeg", 0.8))
        }

        if (isMounted) {
          setPages(newPages)
        }
      } catch (err: any) {
        if (isMounted) setError("Failed to load PDF preview.")
        console.error(err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPdf()

    return () => {
      isMounted = false
    }
  }, [file])

  const togglePage = (pageNum: number) => {
    if (selectionMode === "single") {
      onSelectionChange([pageNum])
      return
    }

    if (selectionMode === "reorder") {
      if (selectedPages.includes(pageNum)) {
        onSelectionChange(selectedPages.filter(p => p !== pageNum))
      } else {
        onSelectionChange([...selectedPages, pageNum]) // Do not sort for reorder
      }
      return
    }

    if (selectedPages.includes(pageNum)) {
      onSelectionChange(selectedPages.filter(p => p !== pageNum))
    } else {
      onSelectionChange([...selectedPages, pageNum].sort((a, b) => a - b))
    }
  }

  const handleUndo = () => {
    if (selectedPages.length > 0) {
      onSelectionChange(selectedPages.slice(0, -1))
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface border border-outline-variant rounded-xl h-64">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">refresh</span>
        <p className="text-on-surface-variant font-body-md">Generating page previews...</p>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 bg-error-container text-on-error-container rounded text-center">{error}</div>
  }

  if (pages.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-label-md text-label-md uppercase font-bold text-on-surface-variant">Select Pages</h3>
        {selectionMode === "multiple" && (
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => onSelectionChange(pages.map((_, i) => i + 1))}
              className="text-primary text-label-sm font-bold uppercase hover:underline"
            >
              Select All
            </button>
            <span className="text-outline-variant">|</span>
            <button 
              type="button"
              onClick={() => onSelectionChange([])}
              className="text-primary text-label-sm font-bold uppercase hover:underline"
            >
              Clear All
            </button>
          </div>
        )}
        {selectionMode === "reorder" && (
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleUndo}
              disabled={selectedPages.length === 0}
              className="text-primary text-label-sm font-bold uppercase hover:underline disabled:opacity-50 disabled:no-underline"
            >
              Undo Last
            </button>
            <span className="text-outline-variant">|</span>
            <button 
              type="button"
              onClick={() => onSelectionChange([])}
              disabled={selectedPages.length === 0}
              className="text-primary text-label-sm font-bold uppercase hover:underline disabled:opacity-50 disabled:no-underline"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto p-2">
        {pages.map((dataUrl, idx) => {
          const pageNum = idx + 1
          const isSelected = selectedPages.includes(pageNum)
          const orderIndex = selectionMode === "reorder" ? selectedPages.indexOf(pageNum) + 1 : 0

          return (
            <button 
              key={idx}
              type="button"
              onClick={() => togglePage(pageNum)}
              className={`relative cursor-pointer group rounded-lg overflow-hidden border-2 transition-all text-left w-full h-full p-0 block ${
                isSelected ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-surface" : "border-outline-variant hover:border-primary"
              }`}
            >
              <img src={dataUrl} alt={`Page ${pageNum}`} className="w-full h-auto bg-white object-contain aspect-[1/1.4] pointer-events-none" />
              
              <div 
                className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors z-10 ${
                  isSelected ? "bg-primary border-primary text-on-primary" : "bg-surface/80 border-outline-variant text-transparent"
                }`}
              >
                {isSelected && (
                  selectionMode === "reorder" ? (
                    <span className="font-bold text-xs">{orderIndex}</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )
                )}
              </div>
              
              <div className="absolute bottom-0 inset-x-0 bg-surface/90 backdrop-blur-sm p-1 text-center border-t border-outline-variant pointer-events-none">
                <span className="font-mono-sm text-on-surface font-medium">Page {pageNum}</span>
              </div>
            </button>
          )
        })}
      </div>
      
      {selectionMode !== "single" && selectedPages.length > 0 && (
        <p className="mt-4 text-center font-body-sm text-on-surface-variant">
          {selectedPages.length} {selectedPages.length === 1 ? "page" : "pages"} selected
        </p>
      )}
    </div>
  )
}
