import React from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Layers,
  HardDrive,
  FileSpreadsheet,
  TrendingUp,
  AlertOctagon,
  Sparkles,
  Award,
  Clock,
  HelpCircle
} from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { formatCurrency, formatNumber, formatDate } from '../lib/utils'

// Category Chart Sub-component
function CategoryDistribution({ data = [] }) {
  const max = Math.max(...data.map((d) => d.value)) || 1
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mb-4">Category Distribution</h3>
      <div className="space-y-3.5">
        {data.map((item, index) => {
          const percent = (item.value / max) * 100
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.label}</span>
                <span className="font-mono text-zinc-500 dark:text-zinc-400">{formatNumber(item.value)} units</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ReportDetailPage() {
  const { id } = useParams()

  // Dynamic stub data dependent on ID parameter
  const reportId = id || 'REP-0091'
  const is91 = reportId === 'REP-0091'

  const reportDetails = {
    id: reportId,
    date: is91 ? '2026-05-22T08:30:00Z' : '2026-05-20T14:15:00Z',
    revenue: is91 ? 14592 : 22401,
    orders: is91 ? 1840 : 2510,
    aov: is91 ? 79.30 : 89.25,
    fileSize: is91 ? '2.4 MB' : '3.8 MB',
    author: 'analyst@acme.com',
    status: 'Completed',
  }

  const aiInsights = [
    {
      title: 'Peak Volume Period',
      desc: 'Purchase velocity accelerated between 10:00 AM and 11:30 AM, resulting in 42% of daily conversions.',
      badge: 'Velocity'
    },
    {
      title: 'Conversion Driver',
      desc: 'Electronics and Accessories accounted for 64% of absolute revenue volume, exhibiting a 4% higher margins checkout.',
      badge: 'Catalog'
    },
    {
      title: 'Retention Behavior',
      desc: 'Repeat customer checkout rates held stable at 32.4%, showing positive correlation with direct email promotions.',
      badge: 'Loyalty'
    }
  ]

  const anomalies = is91 ? [
    {
      id: 'ANOM-102',
      title: 'AOV Sudden Deviation',
      desc: 'The Average Order Value fell to $79.30, marking a 11.2% decline from the rolling 30-day baseline average ($89.28). This indicates customers are ordering lower tier cart volumes.',
      severity: 'Warning',
      remediation: 'Verify whether discount coupon rules were applied simultaneously on multiple levels.'
    }
  ] : [
    {
      id: 'ANOM-101',
      title: 'Volume Spike Alert',
      desc: 'Order volumes spiked 400% above standard thresholds between 14:00 and 15:00. This corresponds to the marketing team mailing list blast.',
      severity: 'Info',
      remediation: 'None required. System server capacities scaled dynamically to manage high throughput checkout sessions.'
    }
  ]

  const categories = [
    { label: 'Consumer Electronics', value: 840 },
    { label: 'Office Supplies & Stationery', value: 520 },
    { label: 'Home Appliances', value: 310 },
    { label: 'Sports & Outdoors', value: 170 },
  ]

  return (
    <DashboardLayout>
      {/* Back button & Title */}
      <div className="mb-8">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to reports
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Report Analytics</h1>
              <span className="badge badge-success mt-0.5">{reportDetails.status}</span>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-1.5 uppercase tracking-wider font-semibold">Report Identifier: {reportDetails.id}</p>
          </div>
          <button className="btn-secondary h-10 gap-2 cursor-pointer">
            <HardDrive className="w-4 h-4 text-zinc-400" />
            Export Raw CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Revenue Stream</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">
            {formatCurrency(reportDetails.revenue)}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Generated from automated ingestion streams</p>
        </div>

        <div className="card">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Orders</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">
            {formatNumber(reportDetails.orders)}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Completed checkout sessions</p>
        </div>

        <div className="card">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">AOV Metrics</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">
            {formatCurrency(reportDetails.aov)}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Average ticket volume size</p>
        </div>

        <div className="card">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Anomalies Logged</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2 flex items-center gap-2">
            {anomalies.length}
            {anomalies.length > 0 && (
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse-slow" />
            )}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Identified statistics deviations</p>
        </div>
      </div>

      {/* Main Insights Panel */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">AI Generated Insights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {aiInsights.map((insight, index) => (
            <div
              key={index}
              className="card relative overflow-hidden group hover:border-brand-500/30 transition-all duration-300"
            >
              {/* Premium Subtle Ambient Radial Glow */}
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-brand-500/10 dark:bg-brand-500/5 blur-xl group-hover:scale-150 transition-all duration-500" />
              
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border border-brand-200/20">
                  <Award className="w-3 h-3" />
                  {insight.badge}
                </span>
                <Clock className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />
              </div>
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{insight.title}</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-normal">
                {insight.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Split Row for Category Distribution and Anomalies List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category distribution */}
        <div className="lg:col-span-2">
          <CategoryDistribution data={categories} />
        </div>

        {/* Diagnostic anomalies profile */}
        <div className="card border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50">
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mb-4">Diagnostics & Anomalies</h3>
          {anomalies.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center h-48">
              <HelpCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Clean Report Profile</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">No metric irregularities flagged by analytics engine.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {anomalies.map((anom, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-red-100 dark:border-red-950/20 bg-red-50/10 dark:bg-red-950/5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 font-mono flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      {anom.id}
                    </span>
                    <span className="badge border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
                      {anom.severity}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-2">{anom.title}</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                    {anom.desc}
                  </p>
                  
                  <div className="border-t border-red-100/50 dark:border-red-950/20 pt-2.5 mt-3 space-y-1">
                    <p className="text-[10px] font-semibold text-zinc-800 dark:text-zinc-200 uppercase">Recommended Remediation:</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">{anom.remediation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ingestion Metadata Sheet */}
      <div className="card mt-6">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mb-4">Ingestion Telemetry Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Date Parsed
            </span>
            <p className="font-medium text-zinc-800 dark:text-zinc-200">{formatDate(reportDetails.date)}</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Workspace Scope
            </span>
            <p className="font-medium text-zinc-800 dark:text-zinc-200">Acme Corp</p>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" /> File Payload Size
            </span>
            <p className="font-medium text-zinc-800 dark:text-zinc-200 font-mono">{reportDetails.fileSize}</p>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Operator Profile
            </span>
            <p className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{reportDetails.author}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
export default ReportDetailPage
