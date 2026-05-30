import React from 'react'
import { cn } from '../../lib/utils'

export function ReportStatusBadge({ status }) {
  const normalized = (status || 'draft').toLowerCase()
  
  const config = {
    draft: {
      label: 'Draft',
      classes: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400',
    },
    uploading: {
      label: 'Uploading',
      classes: 'border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 animate-pulse',
    },
    processing: {
      label: 'Processing',
      classes: 'border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 animate-pulse',
    },
    completed: {
      label: 'Completed',
      classes: 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    },
    failed: {
      label: 'Failed',
      classes: 'border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450',
    },
  }

  const { label, classes } = config[normalized] || config.draft

  return (
    <span className={cn("badge", classes)}>
      {normalized === 'processing' && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
      )}
      {label}
    </span>
  )
}
export default ReportStatusBadge
