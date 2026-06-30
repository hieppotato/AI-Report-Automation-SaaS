import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
// Replaced Lucide icons with Phosphor Icons per design-taste-frontend-v1 guidelines
import { TrendUp, TrendDown, Upload, UserPlus, FileXls, ArrowRight, ArrowsClockwise, Sparkle, Lightning, CheckCircle, X } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { MiniLineChart } from '../components/charts/MiniLineChart'
import { RevenueChart } from '../components/charts/RevenueChart'
import { formatCurrency, formatNumber, formatDate } from '../lib/utils'
import { useUIStore } from '../store/uiStore'
import { useOrgStore } from '../store/orgStore'
import { useReportSummary, useReports } from '../hooks/useReports'
import { useMyPendingInvitations, useAcceptMyInvitation } from '../hooks/useMembers'
import { LoadingState } from '../components/reports/LoadingState'

export function DashboardPage() {
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useReportSummary()
  const { data: reportsResult, isLoading: reportsLoading } = useReports({ limit: 5, offset: 0 })
  const { t } = useTranslation()

  const reports = reportsResult?.items || []

  // Pending invitations
  const { data: pendingInvites = [], isLoading: invitesLoading } = useMyPendingInvitations()
  const acceptInvite = useAcceptMyInvitation()

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
    addToast(t('dashboard.diagnosticsNote'), 'info')
  }

  const kpis = [
    {
      label: t('dashboard.totalRevenue'),
      value: formatCurrency(Number(summary?.total_revenue || 0)),
      trend: '+',
      icon: TrendUp,
      color: '#10b981',
    },
    {
      label: t('dashboard.totalOrders'),
      value: formatNumber(summary?.total_orders || 0),
      trend: '+',
      icon: TrendUp,
      color: '#10b981',
    },
    {
      label: t('dashboard.aov'),
      value: formatCurrency(Number(summary?.avg_order_value || 0)),
      trend: '-',
      icon: TrendDown,
      color: '#10b981',
    },
    {
      label: t('dashboard.repeatRate'),
      value: `${(Number(summary?.repeat_customer_rate || 0) * 100).toFixed(1)}%`,
      trend: '+',
      icon: TrendUp,
      color: '#10b981',
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight leading-none">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={triggerReanalysis} className="btn-secondary h-9 gap-2">
            <ArrowsClockwise className="w-4 h-4 text-zinc-400" />
            {t('dashboard.diagnostics')}
          </button>
          <Link to="/upload" className="btn-primary h-9 gap-2">
            <Upload className="w-4 h-4" />
            {t('dashboard.upload')}
          </Link>
        </div>
      </div>

      {summaryError && (
        <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {summaryError.message}
        </div>
      )}

      {!invitesLoading && pendingInvites.length > 0 && (
        <div className="mb-6 rounded-lg border border-brand-200/50 dark:border-brand-800/40 bg-brand-50/50 dark:bg-brand-950/20 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
                <UserPlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{t('dashboard.pendingInvitations')}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{t('dashboard.workspaceInvitations', { count: pendingInvites.length })}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/80 dark:bg-zinc-900/40 border border-brand-100/50 dark:border-brand-900/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{inv.organization_name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 capitalize">{inv.role}</span>
                </div>
                <button
                  onClick={() => acceptInvite.mutate(inv.token)}
                  disabled={acceptInvite.isPending}
                  className="btn-primary h-8 text-xs gap-1.5 shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t('dashboard.accept')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!reportsLoading && reports.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 mb-4">
            <Lightning className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{t('dashboard.noDataYet')}</h3>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
            {t('dashboard.uploadSpreadsheet')}
          </p>
          <Link to="/upload" className="btn-primary h-9 gap-2 mt-6 inline-flex">
            <Upload className="w-4 h-4" />
            {t('dashboard.uploadReport')}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="card group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{kpi.label}</span>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
                      <Icon className="w-2.5 h-2.5" />
                      {t('dashboard.live')}
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {summaryLoading ? '...' : kpi.value}
                    </span>
                    <MiniLineChart data={fallbackSpark} strokeColor={kpi.color} />
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">{t('dashboard.fromReportSummary')}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
            <div className="lg:col-span-2">
              <RevenueChart data={revenueTrendData.length ? revenueTrendData : [{ label: 'No data', value: 0 }]} />
            </div>

            <div className="card flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
                  <Lightning className="w-4 h-4 text-brand-500" />
                  Quick Actions
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1">{t('dashboard.commonTasks')}</p>
                <div className="space-y-1.5 mt-4">
                  <Link to="/upload" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('dashboard.uploadSalesReport')}</span>
                  </Link>
                  <Link to="/members" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    <UserPlus className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('dashboard.inviteTeamMember')}</span>
                  </Link>
                  <Link to="/reports" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    <FileXls className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('dashboard.viewAllReports')}</span>
                  </Link>
                </div>
              </div>
              <p className="border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-4 text-[11px] text-zinc-400 dark:text-zinc-500 flex items-start gap-1.5">
                <Sparkle className="w-3 h-3 text-brand-500 shrink-0 mt-0.5" />
                {t('dashboard.apiValuesNote')}
              </p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{t('dashboard.latestReports')}</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">{t('dashboard.mostRecentUploads')}</p>
              </div>
              <Link to="/reports" className="text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                {t('dashboard.viewAll')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {reportsLoading ? (
              <div className="py-10 text-center text-sm text-zinc-500">{t('dashboard.loadingReports')}</div>
            ) : reports.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-500">{t('dashboard.noReportsYet')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      <th className="pb-2.5">{t('dashboard.reportId')}</th>
                      <th className="pb-2.5">{t('dashboard.created')}</th>
                      <th className="pb-2.5 text-right">{t('dashboard.revenue')}</th>
                      <th className="pb-2.5 text-right">{t('dashboard.orders')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 font-medium text-zinc-900 dark:text-zinc-100">
                          <Link to={`/reports/${report.id}`} className="hover:text-brand-500 transition-colors">{report.id}</Link>
                        </td>
                        <td className="py-3 text-zinc-500 dark:text-zinc-400 text-xs">{formatDate(report.created_at)}</td>
                        <td className="py-3 text-right font-mono text-xs text-zinc-900 dark:text-zinc-100">{formatCurrency(Number(report.total_revenue || 0))}</td>
                        <td className="py-3 text-right text-zinc-500 dark:text-zinc-400 font-mono text-xs">{formatNumber(report.total_orders || 0)}</td>
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