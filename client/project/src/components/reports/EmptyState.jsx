import React from 'react'
import { FileText, Plus } from 'lucide-react'

export function EmptyState({ title = "No reports found", description = "Get started by initializing your first AI report record.", actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950/20 backdrop-blur-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 mb-4">
        <FileText className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-250">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary h-9 gap-1.5 mt-5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}
export default EmptyState
