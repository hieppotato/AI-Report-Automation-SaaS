import React, { useState, useRef } from 'react'
import { Upload, X, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export function FileUploadCard({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateFile = (file) => {
    if (!file) return false
    setErrorMsg(null)

    const ext = file.name.split('.').pop().toLowerCase()
    const allowed = ['csv', 'xlsx', 'xls', 'pdf']

    if (!allowed.includes(ext)) {
      setErrorMsg('Unsupported format. Only CSV, XLSX, XLS, and PDF files are allowed.')
      return false
    }

    return true
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    onFileSelect(null)
    setErrorMsg(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={cn(
          "border border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[220px] select-none cursor-pointer",
          dragActive
            ? "border-brand-500 bg-brand-50/10 dark:bg-brand-950/5"
            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950/50",
          selectedFile && "pointer-events-none"
        )}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleChange}
          accept=".csv,.xlsx,.xls,.pdf"
          className="hidden"
        />

        {!selectedFile ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 mb-3.5">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Drag & drop report document here
            </h4>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  CSV spreadsheet, Microsoft Excel (XLSX/XLS), or PDF document.
            </p>
          </>
        ) : (
          <div className="w-full flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 text-left pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                {selectedFile.name.endsWith('.pdf') ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-850 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-sm">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5 uppercase">
                  {selectedFile.name.split('.').pop()} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-250 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  )
}
export default FileUploadCard
