import React from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Upload,
  UserPlus,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Zap
} from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { MiniLineChart } from '../components/charts/MiniLineChart'
import { RevenueChart } from '../components/charts/RevenueChart'
import { formatCurrency, formatNumber, formatDate } from '../lib/utils'
import { useUIStore } from '../store/uiStore'

export function DashboardPage() {
  const { addToast } = useUIStore()

  // Trend Data for KPI mini sparklines
  const revenueSparkData = [30, 45, 38, 55, 48, 62, 70]
  const ordersSparkData = [40, 42, 45, 43, 50, 48, 56]
  const aovSparkData = [88, 87, 89, 86, 85, 88, 87]
  const repeatSparkData = [28, 29, 31, 30, 32, 31, 32.4]

  // Monthly Revenue Trend Chart data
  const revenueTrendData = [
    { label: 'Jan', value: 12000 },
    { label: 'Feb', value: 19000 },
    { label: 'Mar', value: 15000 },
    { label: 'Apr', value: 24000 },
    { label: 'May', value: 22000 },
    { label: 'Jun', value: 31000 },
    { label: 'Jul', value: 34592 },
  ]

  // Recent Uploaded Reports
  const recentReports = [
    { id: 'REP-0091', date: '2026-05-22T08:30:00Z', revenue: 14592, orders: 1840, aov: 79.3, status: 'Completed' },
    { id: 'REP-0090', date: '2026-05-20T14:15:00Z', revenue: 22401, orders: 2510, aov: 89.2, status: 'Completed' },
    { id: 'REP-0089', date: '2026-05-18T11:05:00Z', revenue: 18940, orders: 2150, aov: 88.0, status: 'Completed' },
  ]

  // Detected AI Anomalies
  const recentAnomalies = [
    {
      id: 'ANOM-102',
      reportId: 'REP-0091',
      title: 'AOV Sudden Deviation',
      description: 'Average Order Value dropped by 11.2% in REP-0091 compared to standard 30-day baseline levels.',
      severity: 'Warning',
      impact: '-$8.38 per user'
    },
    {
      id: 'ANOM-101',
      reportId: 'REP-0090',
      title: 'Revenue Spike Detected',
      description: 'Order volume spiked significantly between 14:00 and 16:00, possibly due to a marketing promo checkout glitch.',
      severity: 'Info',
      impact: '+$4,500 total volume'
    }
  ]

  const triggerReanalysis = () => {
    addToast('Re-analyzing reports for anomalies...', 'info')
    setTimeout(() => {
      addToast('Anomaly evaluation completed! No new issues found.', 'success')
    }, 1500)
  }

  return (
    <DashboardLayout>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time business insights and anomaly reporting summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerReanalysis}
            className="btn-secondary h-10 gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-zinc-400" />
            Run Diagnostics
          </button>
          <Link
            to="/upload"
            className="btn-primary h-10 gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Report
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Metric 1 */}
        <div className="card hover:border-zinc-300 dark:hover:border-zinc-800 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Revenue</span>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +12.4%
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatCurrency(34592)}
            </span>
            <MiniLineChart data={revenueSparkData} strokeColor="#10b981" />
          </div>
          <p className="mt-2.5 text-xs text-zinc-500">vs. $30,775 last month</p>
        </div>

        {/* Metric 2 */}
        <div className="card hover:border-zinc-300 dark:hover:border-zinc-800 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Orders</span>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +8.1%
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatNumber(5600)}
            </span>
            <MiniLineChart data={ordersSparkData} strokeColor="#10b981" />
          </div>
          <p className="mt-2.5 text-xs text-zinc-500">vs. 5,180 last month</p>
        </div>

        {/* Metric 3 */}
        <div className="card hover:border-zinc-300 dark:hover:border-zinc-800 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">AOV</span>
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3 h-3" />
              -2.3%
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatCurrency(87.68)}
            </span>
            <MiniLineChart data={aovSparkData} strokeColor="#f59e0b" />
          </div>
          <p className="mt-2.5 text-xs text-zinc-500">vs. $89.74 last month</p>
        </div>

        {/* Metric 4 */}
        <div className="card hover:border-zinc-300 dark:hover:border-zinc-800 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Repeat Rate</span>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +4.2%
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              32.4%
            </span>
            <MiniLineChart data={repeatSparkData} strokeColor="#10b981" />
          </div>
          <p className="mt-2.5 text-xs text-zinc-500">vs. 31.1% last month</p>
        </div>
      </div>

      {/* Main Charts & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueTrendData} />
        </div>

        {/* Quick Actions Panel */}
        <div className="card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-brand-500" />
              Quick Actions
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Common administrative shortcuts for managers.</p>
            
            <div className="space-y-2 mt-5">
              <Link
                to="/upload"
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Upload New Sales Report</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Parse CSV or Excel data streams.</p>
                </div>
              </Link>

              <Link
                to="/members"
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Invite Team Member</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Grant analysts access privileges.</p>
                </div>
              </Link>

              <Link
                to="/reports"
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Generate PDF Summary</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Assemble comprehensive reports.</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
              <span>Need help? Check out our AI chatbot integration in the sidebar context menu.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Reports & Anomalies Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Reports List */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Latest Reports</h3>
              <p className="text-xs text-zinc-500">Overview of recent data sheet processing completions.</p>
            </div>
            <Link
              to="/reports"
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
            >
              View all
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="pb-3">Report ID</th>
                  <th className="pb-3">Ingested At</th>
                  <th className="pb-3 text-right">Revenue</th>
                  <th className="pb-3 text-right">Orders</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {recentReports.map((rep) => (
                  <tr key={rep.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                    <td className="py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                      <Link to={`/reports/${rep.id}`} className="hover:text-brand-500 transition-colors">
                        {rep.id}
                      </Link>
                    </td>
                    <td className="py-3.5 text-zinc-500 dark:text-zinc-400 text-xs">
                      {formatDate(rep.date)}
                    </td>
                    <td className="py-3.5 text-right font-mono text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(rep.revenue)}
                    </td>
                    <td className="py-3.5 text-right text-zinc-500 dark:text-zinc-400 font-mono">
                      {formatNumber(rep.orders)}
                    </td>
                    <td className="py-3.5">
                      <span className="badge badge-success">
                        {rep.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Anomalies Panel */}
        <div className="card border-amber-200/50 dark:border-amber-950/30 bg-amber-50/10 dark:bg-amber-950/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Active AI Anomalies</h3>
              <p className="text-[10px] text-zinc-400">Flagged deviation trends requiring verification.</p>
            </div>
          </div>

          <div className="space-y-3">
            {recentAnomalies.map((anom) => (
              <div
                key={anom.id}
                className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white dark:bg-zinc-950/50 shadow-sm relative group hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase font-mono">{anom.id}</span>
                  <span className={anom.severity === 'Warning' ? 'badge badge-warning' : 'badge badge-info'}>
                    {anom.severity}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1.5">{anom.title}</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                  {anom.description}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-900">
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold uppercase">
                    Impact: {anom.impact}
                  </span>
                  <Link
                    to={`/reports/${anom.reportId}`}
                    className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                  >
                    Investigate
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
export default DashboardPage