import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  FileText,
  Plus
} from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { formatCurrency, formatNumber, formatDate } from '../lib/utils'
import { useUIStore } from '../store/uiStore'

export function ReportsPage() {
  const { addToast } = useUIStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  // Mock database rows
  const allReports = [
    { id: 'REP-0091', date: '2026-05-22T08:30:00Z', revenue: 14592, orders: 1840, aov: 79.30, status: 'Completed' },
    { id: 'REP-0090', date: '2026-05-20T14:15:00Z', revenue: 22401, orders: 2510, aov: 89.25, status: 'Completed' },
    { id: 'REP-0089', date: '2026-05-18T11:05:00Z', revenue: 18940, orders: 2150, aov: 88.09, status: 'Completed' },
    { id: 'REP-0088', date: '2026-05-15T09:00:00Z', revenue: 12050, orders: 1390, aov: 86.69, status: 'Completed' },
    { id: 'REP-0087', date: '2026-05-12T16:40:00Z', revenue: 8400, orders: 980, aov: 85.71, status: 'Processing' },
    { id: 'REP-0086', date: '2026-05-10T10:20:00Z', revenue: 0, orders: 0, aov: 0, status: 'Failed' },
    { id: 'REP-0085', date: '2026-05-08T13:15:00Z', revenue: 15420, orders: 1810, aov: 85.19, status: 'Completed' },
    { id: 'REP-0084', date: '2026-05-05T15:30:00Z', revenue: 13900, orders: 1620, aov: 85.80, status: 'Completed' },
  ]

  const filteredReports = allReports.filter((rep) => {
    const matchesSearch = rep.id.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || rep.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage)

  const handleDownload = (id) => {
    addToast(`Downloading report CSV data for ${id}...`, 'success')
  }

  const handleDelete = (id) => {
    addToast(`Report ${id} deleted successfully.`, 'success')
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Processed Reports</h1>
          <p className="text-sm text-zinc-500 mt-1">Browse, query, and download history profiles of compiled analytics.</p>
        </div>
        <Link to="/upload" className="btn-primary h-10 gap-2">
          <Plus className="w-4 h-4" />
          Ingest Sales Data
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 w-full">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by report ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="input pl-10"
          />
        </div>

        <div className="relative w-full sm:w-44">
          <Filter className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="input pl-10 cursor-pointer appearance-none bg-none"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden mb-6">
        {paginatedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 mb-4 animate-pulse">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">No reports found</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
              We couldn't find any reports matching "{search}" or status "{statusFilter}". Please adjust your parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Report ID</th>
                  <th className="py-3 px-6">Created Date</th>
                  <th className="py-3 px-6 text-right">Revenue</th>
                  <th className="py-3 px-6 text-right">Total Orders</th>
                  <th className="py-3 px-6 text-right">AOV</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {paginatedReports.map((rep) => (
                  <tr key={rep.id} className="group hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100">
                      <Link to={`/reports/${rep.id}`} className="hover:text-brand-500 transition-colors">
                        {rep.id}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs">
                      {formatDate(rep.date)}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-zinc-900 dark:text-zinc-100">
                      {rep.status === 'Failed' ? '—' : formatCurrency(rep.revenue)}
                    </td>
                    <td className="py-4 px-6 text-right text-zinc-500 dark:text-zinc-400 font-mono">
                      {rep.status === 'Failed' ? '—' : formatNumber(rep.orders)}
                    </td>
                    <td className="py-4 px-6 text-right text-zinc-500 dark:text-zinc-400 font-mono">
                      {rep.status === 'Failed' ? '—' : formatCurrency(rep.aov)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={
                          rep.status === 'Completed'
                            ? 'badge badge-success'
                            : rep.status === 'Processing'
                            ? 'badge badge-warning'
                            : 'badge badge-danger'
                        }
                      >
                        {rep.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          to={`/reports/${rep.id}`}
                          className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                          title="View analytics profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDownload(rep.id)}
                          disabled={rep.status !== 'Completed'}
                          className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Download dataset"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rep.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="Remove record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredReports.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            Showing <span className="font-semibold text-zinc-800 dark:text-zinc-200">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {Math.min(startIndex + itemsPerPage, filteredReports.length)}
            </span>{' '}
            of <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredReports.length}</span> reports
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="btn-secondary h-8 px-2.5 text-xs select-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={
                  currentPage === i + 1
                    ? 'flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs transition-all shadow-sm'
                    : 'btn-secondary h-8 w-8 justify-center text-xs select-none cursor-pointer'
                }
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn-secondary h-8 px-2.5 text-xs select-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
export default ReportsPage
