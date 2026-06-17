import React from 'react'
import { Loader2, CheckCircle2, AlertOctagon } from 'lucide-react'
import { cn } from '../../lib/utils'

export function UploadProgress({ progress = 0, state = 'uploading', error }) {
  const isUploading = state === 'uploading'
  const isProcessing = state === 'processing'
  const isCompleted = state === 'completed'
  const isFailed = state === 'failed'

  const descriptions = {
    uploading: 'Uploading raw document binary sheets...',
    processing: 'Synthesizing report stats and anomaly deviation logs...',
    completed: 'AI Report processing successfully compiled!',
    failed: error || 'Analysis failed due to cell format inconsistencies.',
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {(isUploading || isProcessing) && (
            <Loader2 className="w-4 h-4 animate-spin text-brand-600 dark:text-brand-400" />
          )}
          {isCompleted && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
          {isFailed && (
            <AlertOctagon className="w-4 h-4 text-rose-500 animate-bounce" />
          )}
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {isUploading && "Uploading Document"}
            {isProcessing && "AI Analysis In Progress"}
            {isCompleted && "AI Analysis Complete"}
            {isFailed && "Ingestion Failed"}
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-zinc-500">
          {progress}%
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isFailed
              ? 'bg-rose-500'
              : isCompleted
              ? 'bg-emerald-500'
              : 'bg-brand-600'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className={cn(
        "text-[11px] leading-normal",
        isFailed ? "text-rose-600 dark:text-rose-450" : "text-zinc-500 dark:text-zinc-400"
      )}>
        {descriptions[state] || descriptions.uploading}
      </p>
    </div>
  )
}
export default UploadProgress
