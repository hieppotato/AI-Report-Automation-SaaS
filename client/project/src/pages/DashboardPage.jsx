import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Upload, UserPlus, FileSpreadsheet, ArrowUpRight, RefreshCw, Sparkles, Zap } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { MiniLineChart } from '../components/charts/MiniLineChart'
import { RevenueChart } from '../components/charts/RevenueChart'
import { formatCurrency, formatNumber, formatDate } from '../lib/utils'
import { useUIStore } from '../store/uiStore'
import { useOrgStore } from '../store/orgStore'
import { useReportSummary, useReports } from '../hooks/useReports'
import { LoadingState } from '../components/reports/LoadingState'

export function DashboardPage() {
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useReportSummary()
  const { data: reportsResult, isLoading: reportsLoading } = useReports({ limit: 5, offset: 0 })

  const reports = reportsResult?.items || []

  // Automatic invalidation of dashboard KPI cards & charts when reports transition from processing to complete/failed
  const activeReportsCount = reports.filter(r => r.status === 'processing' || r.status === 'uploading').length
  useEffect(() => {
    if (activeReportsCount === 0 && reports.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['report-summary', activeOrg?.id] })
    }
  }, [activeReportsCount, reports.length, activeOrg?.id, queryClient])

  if (summaryLoading || reportsLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="h-7 w-48 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-850 mt-2 animate-pulse" />
          </div>
        </div>
        <div className="space-y-6">
          <LoadingState type="cards" count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LoadingState type="charts" />
            </div>
            <div className="card space-y-4 animate-pulse">
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-48 rounded bg-zinc-100 dark:bg-zinc-850" />
              <div className="space-y-2 mt-5">
                <div className="h-10 w-full rounded bg-zinc-100 dark:bg-zinc-850" />
                <div className="h-10 w-full rounded bg-zinc-100 dark:bg-zinc-850" />
                <div className="h-10 w-full rounded bg-zinc-100 dark:bg-zinc-850" />
              </div>
            </div>
          </div>
          <LoadingState type="table" count={5} />
        </div>
      </DashboardLayout>
    )
  }
  const revenueTrendData = reports.slice().reverse().map((report, index) => ({
    label: report.created_at ? formatDate(report.created_at).split(',')[0] : `R${index + 1}`,
    value: Number(report.total_revenue || 0),
  }))
  const sparkData = reports.map((report) => Number(report.total_revenue || 0))
  const fallbackSpark = sparkData.length > 1 ? sparkData : [0, Number(summary?.total_revenue || 0)]

  const triggerReanalysis = () => {
    addToast('Diagnostics will be available after AI processing is connected.', 'info')
  }

  const kpis = [
    {
      label: 'Total Revenue',
      value: formatCurrency(Number(summary?.total_revenue || 0)),
      trend: '+',
      icon: TrendingUp,
      color: '#10b981',
    },
    {
      label: 'Total Orders',
      value: formatNumber(summary?.total_orders || 0),
      trend: '+',
      icon: TrendingUp,
      color: '#10b981',
    },
    {
      label: 'AOV',
      value: formatCurrency(Number(summary?.avg_order_value || 0)),
      trend: '-',
      icon: TrendingDown,
      color: '#f59e0b',
    },
    {
      label: 'Repeat Rate',
      value: `${(Number(summary?.repeat_customer_rate || 0) * 100).toFixed(1)}%`,
      trend: '+',
      icon: TrendingUp,
      color: '#10b981',
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Real-time business insights and report summaries.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={triggerReanalysis} className="btn-secondary h-10 gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4 text-zinc-400" />
            Run Diagnostics
          </button>
          <Link to="/upload" className="btn-primary h-10 gap-2">
            <Upload className="w-4 h-4" />
            Upload Report
          </Link>
        </div>
      </div>

      {summaryError && (
        <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {summaryError.message}
        </div>
      )}

      {!reportsLoading && reports.length === 0 ? (
        <div className="card py-16 text-center max-w-xl mx-auto border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 rounded-2xl flex flex-col items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 text-brand-600 dark:text-brand-400 mb-4 animate-pulse">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">No analytics available yet.</h3>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
            Upload a dataset to get started.
          </p>
          <Link to="/reports" className="btn-primary h-10 gap-2 mt-6">
            <Upload className="w-4 h-4" />
            Upload Report
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {kpis.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="card hover:border-zinc-300 dark:hover:border-zinc-800 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{kpi.label}</span>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                      <Icon className="w-3 h-3" />
                      Live
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {summaryLoading ? '...' : kpi.value}
                    </span>
                    <MiniLineChart data={fallbackSpark} strokeColor={kpi.color} />
                  </div>
                  <p className="mt-2.5 text-xs text-zinc-500">Updated from report summary API</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <RevenueChart data={revenueTrendData.length ? revenueTrendData : [{ label: 'No data', value: 0 }]} />
            </div>

            <div className="card flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-brand-500" />
                  Quick Actions
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Common administrative shortcuts.</p>
                <div className="space-y-2 mt-5">
                  <Link to="/upload" className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                    <Upload className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Upload New Sales Report</span>
                  </Link>
                  <Link to="/members" className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                    <UserPlus className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Invite Team Member</span>
                  </Link>
                  <Link to="/reports" className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">View Reports</span>
                  </Link>
                </div>
              </div>
              <p className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4 text-[11px] text-zinc-400 dark:text-zinc-500 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                Dashboard values come from tenant-scoped FastAPI endpoints.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Latest Reports</h3>
                <p className="text-xs text-zinc-500">Most recent report records.</p>
              </div>
              <Link to="/reports" className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {reportsLoading ? (
              <div className="py-10 text-center text-sm text-zinc-500">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-500">No reports yet. Upload a spreadsheet to start.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      <th className="pb-3">Report ID</th>
                      <th className="pb-3">Created</th>
                      <th className="pb-3 text-right">Revenue</th>
                      <th className="pb-3 text-right">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td className="py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                          <Link to={`/reports/${report.id}`} className="hover:text-brand-500 transition-colors">{report.id}</Link>
                        </td>
                        <td className="py-3.5 text-zinc-500 dark:text-zinc-400 text-xs">{formatDate(report.created_at)}</td>
                        <td className="py-3.5 text-right font-mono text-zinc-900 dark:text-zinc-100">{formatCurrency(Number(report.total_revenue || 0))}</td>
                        <td className="py-3.5 text-right text-zinc-500 dark:text-zinc-400 font-mono">{formatNumber(report.total_orders || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

export default DashboardPage
