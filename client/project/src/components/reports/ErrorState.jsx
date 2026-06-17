import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export function ErrorState({ title = "Failed to load details", error, onRetry }) {
  const message = error?.message || error || "An unexpected network error occurred."
  
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-rose-100 dark:border-rose-950/20 bg-rose-50/10 dark:bg-rose-950/5 rounded-2xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-450 mb-4 animate-pulse">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-400">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary h-9 gap-1.5 mt-5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  )
}
export default ErrorState
