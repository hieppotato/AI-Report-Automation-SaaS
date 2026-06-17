import React from 'react'
import { Calendar, Activity, FileText, UploadCloud } from 'lucide-react'
import { formatDate } from '../../lib/utils'

export function ReportSummaryCard({ report }) {
  if (!report) return null

  return (
    <div className="card space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">Report Overview</h4>
        <p className="text-[11px] text-zinc-500 mt-1">Ingestion metadata and analysis state.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs">
        <div className="space-y-1">
          <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Status
          </span>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
            {report.status || 'draft'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Created At
          </span>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">{formatDate(report.created_at)}</p>
        </div>

        <div className="space-y-1">
          <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5" /> Source File
          </span>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {report.file_name || 'No file uploaded'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> File Type
          </span>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono uppercase">
            {report.file_type || 'Pending'}
          </p>
        </div>
      </div>

      {report.description && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 pt-3.5 mt-2 space-y-1">
          <span className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Analysis Scope & Intent</span>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">{report.description}</p>
        </div>
      )}
    </div>
  )
}

export default ReportSummaryCard
