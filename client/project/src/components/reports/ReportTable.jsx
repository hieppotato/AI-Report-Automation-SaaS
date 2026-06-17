import React from 'react'
import { Link } from 'react-router-dom'
import { Eye, Trash2, Calendar, FileText } from 'lucide-react'
import { ReportStatusBadge } from './ReportStatusBadge'
import { formatDate, cn } from '../../lib/utils'

export function ReportTable({ reports = [], onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <th className="py-3.5 px-6">Report Title</th>
            <th className="py-3.5 px-6">Source File</th>
            <th className="py-3.5 px-6">Processing Status</th>
            <th className="py-3.5 px-6">Created At</th>
            <th className="py-3.5 px-6">Task Progress</th>
            <th className="py-3.5 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {reports.map((rep) => {
            const isProcessing = rep.status === 'processing' || rep.status === 'uploading'
            const progress = rep.progress || (rep.status === 'completed' ? 100 : 0)

            return (
              <tr key={rep.id} className="group hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100">
                  <Link to={`/reports/${rep.id}`} className="hover:text-brand-500 transition-colors">
                    {rep.title || 'Untitled Report'}
                  </Link>
                </td>
                
                <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400 text-xs">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    {rep.file_name || 'Pending upload'}
                  </span>
                </td>
                
                <td className="py-4 px-6">
                  <ReportStatusBadge status={rep.status} />
                </td>
                
                <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {formatDate(rep.created_at || rep.createdAt)}
                  </span>
                </td>
                
                <td className="py-4 px-6 w-44">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-24 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          rep.status === 'failed'
                            ? 'bg-rose-500'
                            : rep.status === 'completed'
                            ? 'bg-emerald-500'
                            : 'bg-brand-600'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </td>
                
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2.5">
                    <Link
                      to={`/reports/${rep.id}`}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                      title="Inspect analysis"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you absolutely sure you want to delete this report record?')) {
                          onDelete(rep.id)
                        }
                      }}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                      title="Remove report record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
export default ReportTable
