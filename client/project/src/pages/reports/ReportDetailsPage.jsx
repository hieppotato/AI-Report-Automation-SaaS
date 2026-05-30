import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Code, Clipboard, Check, Sparkles, UploadCloud, Download, AlertTriangle, AlertOctagon, FileText, CheckCircle2 } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { ReportStatusBadge } from '../../components/reports/ReportStatusBadge'
import { ReportSummaryCard } from '../../components/reports/ReportSummaryCard'
import { MetricsGrid } from '../../components/reports/MetricsGrid'
import { InsightCard } from '../../components/reports/InsightCard'
import { ChartsSection } from '../../components/reports/ChartsSection'
import { LoadingState } from '../../components/reports/LoadingState'
import { ErrorState } from '../../components/reports/ErrorState'
import { FileUploadCard } from '../../components/reports/FileUploadCard'
import { UploadProgress } from '../../components/reports/UploadProgress'
import { ProcessingTimeline } from '../../components/reports/ProcessingTimeline'
import { useReportDetails } from '../../hooks/useReportDetails'
import { useReports } from '../../hooks/useReports'
import { useReportStatus } from '../../hooks/useReportStatus'
import { useUploadReport } from '../../hooks/useUploadReport'
import { useUIStore } from '../../store/uiStore'

function asNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function getReportJson(report) {
  if (!report?.report_json) return {}
  if (typeof report.report_json === 'string') {
    try {
      return JSON.parse(report.report_json)
    } catch {
      return {}
    }
  }
  return report.report_json
}

function normalizeInsightItems(value, type) {
  if (!Array.isArray(value)) return []
  return value
    .filter(Boolean)
    .map((item) => {
      if (typeof item === 'object') {
        return {
          type: item.type || type,
          title: item.title || type,
          description: item.description || item.text || item.summary || JSON.stringify(item),
          impact: item.impact,
        }
      }
      return {
        type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        description: String(item),
      }
    })
}

function buildInsights(report, reportJson) {
  const source = reportJson.insights || report?.insights || {}
  const anomalies = report?.anomalies || source.anomalies

  if (Array.isArray(source)) {
    return normalizeInsightItems(source, 'trend')
  }

  return [
    ...normalizeInsightItems(source.trends, 'trend'),
    ...normalizeInsightItems(anomalies, 'anomaly'),
    ...normalizeInsightItems(source.risks, 'risk'),
    ...normalizeInsightItems(source.recommendations, 'recommendation'),
  ]
}

function metricFromReportJson(reportJson, keys) {
  const metrics = reportJson.metrics || []
  if (Array.isArray(metrics)) {
    const match = metrics.find((metric) => keys.includes(String(metric?.key || metric?.name || '').toLowerCase()))
    return match?.value
  }
  if (metrics && typeof metrics === 'object') {
    const key = keys.find((candidate) => metrics[candidate] !== undefined)
    return key ? metrics[key] : undefined
  }
  return undefined
}

function buildMetrics(report, reportJson) {
  return {
    totalRevenue: asNumber(report?.total_revenue ?? metricFromReportJson(reportJson, ['total_revenue', 'revenue'])),
    totalOrders: asNumber(report?.total_orders ?? metricFromReportJson(reportJson, ['total_orders', 'orders'])),
    averageOrderValue: asNumber(report?.aov ?? metricFromReportJson(reportJson, ['aov', 'avg_order_value'])),
    repeatCustomerRate: asNumber(report?.repeat_rate ?? metricFromReportJson(reportJson, ['repeat_rate', 'repeat_customer_rate'])),
  }
}

function buildChartData(report, reportJson) {
  const rawCharts = report?.charts || reportJson.charts || []
  if (!Array.isArray(rawCharts)) {
    return {
      trendData: rawCharts.trendData || [],
      categoryData: rawCharts.categoryData || [],
      distributionData: rawCharts.distributionData || [],
    }
  }

  const toRows = (chart) => {
    const labels = chart.labels || []
    const values = chart.values || []
    return labels.map((label, index) => ({
      label,
      name: label,
      value: asNumber(values[index]),
      revenue: asNumber(values[index]),
      orders: asNumber(chart.orders?.[index] || 0),
    }))
  }

  const trend = rawCharts.find((chart) => ['line', 'trend', 'timeseries'].includes(String(chart.type).toLowerCase()))
  const category = rawCharts.find((chart) => ['bar', 'category'].includes(String(chart.type).toLowerCase()))
  const distribution = rawCharts.find((chart) => ['pie', 'distribution', 'donut'].includes(String(chart.type).toLowerCase()))

  return {
    trendData: trend ? toRows(trend) : [],
    categoryData: category ? toRows(category) : [],
    distributionData: distribution ? toRows(distribution) : [],
  }
}

export function ReportDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)

  const { addToast } = useUIStore()

  const { report, isLoading, isError, error, refetch } = useReportDetails(id)
  const { statusData, status, progress, errorMessage } = useReportStatus(id)
  const { uploadFile, isUploading, error: uploadError } = useUploadReport()
  const { deleteReport } = useReports()

  useEffect(() => {
    if (statusData?.status === 'completed') {
      refetch()
    }
  }, [statusData?.status, refetch])

  const [prevStatus, setPrevStatus] = useState(null)
  const activeStatus = status || report?.status || 'draft'

  useEffect(() => {
    if (activeStatus && activeStatus !== prevStatus) {
      if (prevStatus === 'processing' && activeStatus === 'completed') {
        addToast('AI Analysis completed successfully!', 'success')
      } else if (prevStatus === 'processing' && activeStatus === 'failed') {
        addToast('AI Analysis failed. Please review error details.', 'error')
      }
      setPrevStatus(activeStatus)
    }
  }, [activeStatus, prevStatus, addToast])

  const [retryMode, setRetryMode] = useState(false)

  const reportJson = useMemo(() => getReportJson(report), [report])
  const metrics = useMemo(() => buildMetrics(report, reportJson), [report, reportJson])
  const insights = useMemo(() => buildInsights(report, reportJson), [report, reportJson])
  const chartData = useMemo(() => buildChartData(report, reportJson), [report, reportJson])

  const anomaliesList = useMemo(() => {
    if (!report?.anomalies) return []
    if (Array.isArray(report.anomalies)) return report.anomalies
    if (typeof report.anomalies === 'object') {
      const list = report.anomalies.anomalies || report.anomalies.items || report.anomalies.list
      if (Array.isArray(list)) return list
      return Object.values(report.anomalies).map(val => 
        typeof val === 'object' ? val.description || val.message || JSON.stringify(val) : String(val)
      )
    }
    return [String(report.anomalies)]
  }, [report?.anomalies])

  const activeProgress = isUploading && uploadPercent < 100 ? Math.max(10, Math.round(uploadPercent * 0.1)) : (progress || report?.progress || 0)
  const activeStep = statusData?.current_step || report?.current_step
  const showPipelineState = Boolean(report?.file_url || activeStatus !== 'draft' || isUploading)

  const handleDelete = async () => {
    if (window.confirm('Are you absolutely sure you want to delete this report? This will remove all telemetry permanently.')) {
      await deleteReport(id)
      navigate('/reports')
    }
  }

  const handleFileSelect = async (file) => {
    if (!file) return
    setUploadPercent(0)
    setRetryMode(false)
    addToast('Upload started: sending document to secure storage...', 'info')
    await uploadFile({
      id,
      file,
      onProgress: setUploadPercent,
    })
  }

  const handleRetryUpload = () => {
    setRetryMode(true)
  }

  const handleCopy = () => {
    if (!report) return
    navigator.clipboard.writeText(JSON.stringify(report, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <LoadingState type="cards" count={3} />
          <LoadingState type="table" count={3} />
        </div>
      </DashboardLayout>
    )
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
          </Link>
        </div>
        <ErrorState error={error} onRetry={refetch} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-505 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Reports
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                {report?.title || 'Untitled Report'}
              </h1>
              <ReportStatusBadge status={activeStatus} />
            </div>
            <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
              UUID Scope: {id}
            </p>
          </div>
          
          <button
            onClick={handleDelete}
            className="btn-danger h-10 gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete Report
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <ReportSummaryCard report={{ ...report, status: activeStatus, progress: activeProgress, current_step: activeStep }} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div className="space-y-6">
            {activeStatus === 'failed' && !retryMode ? (
              <div className="card border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10 p-6 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-450 mb-4 animate-pulse">
                  <AlertOctagon className="w-5 h-5 animate-bounce" />
                </div>
                <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-400">AI Processing Failed</h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                  Reason: <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{errorMessage || report?.error_message || "Cell format inconsistencies or processing limits."}</span>
                </p>
                <button
                  onClick={handleRetryUpload}
                  className="btn-primary h-9 gap-1.5 mt-5 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  Retry Upload
                </button>
              </div>
            ) : (
              <>
                {report?.file_name && !retryMode ? (
                  <div className="card space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-600" />
                        <span className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">Source File Details</span>
                      </div>
                      {report?.file_url && (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary h-8 px-3 text-[10px] gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Source
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">File Name</span>
                        <p className="font-medium text-xs text-zinc-800 dark:text-zinc-200 mt-1 truncate" title={report.file_name}>
                          {report.file_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">File Type</span>
                        <p className="font-medium text-xs text-zinc-850 dark:text-zinc-200 mt-1 uppercase">
                          {report.file_type || report.file_name.split('.').pop()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Uploaded At</span>
                        <p className="font-medium text-xs text-zinc-850 dark:text-zinc-200 mt-1">
                          {new Date(report.updated_at || report.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card space-y-4">
                    <div className="flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-brand-500" />
                      <h3 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">Upload Source File</h3>
                    </div>
                    
                    {!report?.file_name && !isUploading && (
                      <div className="p-3 text-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20 mb-1">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">No source file uploaded yet.</p>
                      </div>
                    )}

                    <FileUploadCard onFileSelect={handleFileSelect} />
                    {uploadError && (
                      <p className="text-xs text-rose-600 dark:text-rose-450">{uploadError.message || 'Upload failed.'}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-6">
            {showPipelineState && (
              <ProcessingTimeline
                progress={activeProgress}
                status={activeStatus}
                currentStep={activeStep}
                errorMessage={errorMessage || report?.error_message}
              />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4">Ingestion Telemetry KPIs</h3>
          <MetricsGrid metrics={metrics} />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-500" />
            AI Analytical Recommendations
          </h3>
          {insights.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {insights.map((ins, idx) => (
                <InsightCard
                  key={`${ins.type}-${idx}`}
                  type={ins.type}
                  title={ins.title}
                  description={ins.description}
                  impact={ins.impact}
                />
              ))}
            </div>
          ) : (
            <div className="card py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Insights will appear here after the report is completed.
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Ingestion Anomaly Deviation Logs
          </h3>
          {anomaliesList.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomaliesList.map((anomaly, idx) => (
                <div 
                  key={`anomaly-${idx}`} 
                  className="p-4 rounded-xl border border-amber-250/60 dark:border-amber-900/30 bg-amber-50/10 dark:bg-amber-950/5 text-amber-800 dark:text-amber-400 flex items-start gap-3 text-xs leading-relaxed"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                  <div>
                    <span className="font-semibold">Anomaly detected:</span>
                    <p className="mt-0.5 text-zinc-650 dark:text-zinc-400 font-mono text-[11px]">{anomaly}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card py-8 text-center text-xs text-zinc-500 dark:text-zinc-400 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-500 mb-2">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">No anomalies detected.</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4">Interactive Performance Visualizations</h3>
          <ChartsSection charts={report?.charts} />
        </div>

        <div className="card p-0 overflow-hidden">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center justify-between w-full p-4 font-semibold text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Code className="w-4 h-4 text-zinc-400" />
              Raw Report Payload Data (JSON)
            </span>
            <span className="text-[10px] text-zinc-450">
              {showJson ? 'Collapse Viewer' : 'Expand Viewer'}
            </span>
          </button>

          {showJson && (
            <div className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-950 p-4 relative animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={handleCopy}
                className="absolute top-4 right-4 p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                title="Copy report payload"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
              <pre className="overflow-x-auto text-[10px] text-zinc-300 font-mono pr-24 max-h-96">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ReportDetailsPage
