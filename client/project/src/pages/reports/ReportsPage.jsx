import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, RefreshCw } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { ReportTable } from '../../components/reports/ReportTable'
import { CreateReportModal } from '../../components/reports/CreateReportModal'
import { EmptyState } from '../../components/reports/EmptyState'
import { LoadingState } from '../../components/reports/LoadingState'
import { ErrorState } from '../../components/reports/ErrorState'
import { useReports, useCreateReport, useDeleteReport } from '../../hooks/useReports'

export function ReportsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: reportsResult, isLoading, isError, error, refetch } = useReports()
  const { mutateAsync: createReport } = useCreateReport()
  const { mutateAsync: deleteReport } = useDeleteReport()
  const reports = reportsResult?.items || []
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCreate = async (data) => {
    try {
      const newReport = await createReport(data)
      navigate(`/reports/${newReport.id}`)
    } catch (e) {
      // handled globally
    }
  }

  const filtered = reports.filter((r) => {
    const matchesSearch = (r.title || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || (r.status || '').toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">{t('reports.title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="btn-secondary h-10 gap-1.5 cursor-pointer"
            title={t('reports.refreshTooltip')}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('reports.syncRecords')}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary h-10 gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('reports.createReport')}
          </button>
        </div>
      </div>

      {reports.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 w-full">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={t('reports.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="relative w-full sm:w-44">
            <Filter className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input pl-10 cursor-pointer appearance-none bg-none"
            >
              <option value="All">{t('reports.allStatuses')}</option>
              <option value="Draft">{t('reports.statusDraft')}</option>
              <option value="Uploading">{t('reports.statusUploading')}</option>
              <option value="Processing">{t('reports.statusProcessing')}</option>
              <option value="Completed">{t('reports.statusCompleted')}</option>
              <option value="Failed">{t('reports.statusFailed')}</option>
            </select>
          </div>
        </div>
      )}

      {isLoading && <LoadingState type="table" count={4} />}
      
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          {reports.length === 0 ? (
            <EmptyState
              title={t('reports.noReportsYet')}
              description={t('reports.noReportsDescription')}
              actionLabel={t('reports.createReport')}
              onAction={() => setIsModalOpen(true)}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('reports.noMatchingReports')}
              description={t('reports.noMatchingReportsDescription', { search, status: statusFilter })}
            />
          ) : (
            <div className="card p-0 overflow-hidden">
              <ReportTable reports={filtered} onDelete={deleteReport} />
            </div>
          )}
        </>
      )}

      <CreateReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </DashboardLayout>
  )
}
export default ReportsPage
