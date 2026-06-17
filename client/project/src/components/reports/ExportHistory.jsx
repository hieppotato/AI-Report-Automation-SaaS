import React, { useState } from 'react'
import { FileText, Download, Link2, Check, Loader2, Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'


export function ExportHistory({ exports = [], onExport, isExporting, onDelete }) {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [actionIndex, setActionIndex] = useState(null)

  const handleCopyLink = async (format, index) => {
    setActionIndex(index)
    try {
      // Triggers the parent's export action which fetches a fresh signed URL
      const result = await onExport(format)
      if (result?.signed_url) {
        await navigator.clipboard.writeText(result.signed_url)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      }
    } catch (err) {
      // handled inside hook  
    } finally {
      setActionIndex(null)
    }
  }

  const handleDownload = async (format, index) => {
    setActionIndex(index)
    try {
      await onExport(format)
    } catch (err) {
      // handled inside hook
    } finally {
      setActionIndex(null)
    }
  }

  if (!exports || exports.length === 0) {
    return (
      <div className="card py-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">No export history found. Export a report to generate records.</p>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
        <h4 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">Generated Export History</h4>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {exports.map((item, idx) => {
          const isPdf = item.format === 'pdf'
          const isCurrentAction = actionIndex === idx

          return (
            <div key={idx} className="p-3.5 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border",
                  isPdf
                    ? "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400"
                    : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400"
                )}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {item.file_path ? item.file_path.split('/').pop() : `report.${item.format}`}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                    Generated on {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  disabled={isExporting || isCurrentAction}
                  onClick={() => handleDownload(item.format, idx)}
                  className="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Download File"
                >
                  {isCurrentAction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  disabled={isExporting || isCurrentAction}
                  onClick={() => handleCopyLink(item.format, idx)}
                  className="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Copy Signed Link"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  disabled={isExporting || isCurrentAction}
                  onClick={() => onDelete(idx)}
                  className="p-1.5 rounded-md text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                  title="Delete Export"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ExportHistory
