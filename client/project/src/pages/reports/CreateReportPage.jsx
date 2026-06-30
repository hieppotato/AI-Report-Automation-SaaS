import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Sparkles, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { FileUploadCard } from '../../components/reports/FileUploadCard'
import { UploadProgress } from '../../components/reports/UploadProgress'
import { useCreateReport } from '../../hooks/useReports'
import { useUploadReport } from '../../hooks/useUploadReport'
import { useReportStatus } from '../../hooks/useReportStatus'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const metadataSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
})

export function CreateReportPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [createdReportId, setCreatedReportId] = useState(null)
  const [uploadPercent, setUploadPercent] = useState(0)

  const { mutateAsync: createReport } = useCreateReport()
  const { uploadFile } = useUploadReport()
  const { status, progress, errorMessage, refetch } = useReportStatus(createdReportId)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(metadataSchema),
    defaultValues: { title: '', description: '' }
  })

  const onMetadataSubmit = async (data) => {
    try {
      const response = await createReport({
        title: data.title,
        description: data.description || undefined,
      })
      setCreatedReportId(response.id)
      setStep(2)
    } catch (e) {
      // handled globally
    }
  }

  const handleFileSelect = async (file) => {
    if (!file || !createdReportId) return
    
    setStep(3)
    setUploadPercent(0)
    
    try {
      await uploadFile({
        id: createdReportId,
        file,
        onProgress: (percent) => setUploadPercent(percent)
      })
      refetch()
    } catch (e) {
      setStep(2)
    }
  }

  const activeProgress = step === 3 && uploadPercent < 100
    ? Math.max(10, Math.round(uploadPercent * 0.1))
    : (progress || 10)

  const activeState = step === 3 && uploadPercent < 100
    ? 'uploading'
    : (status || 'processing')

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('reports.backToReports')}
        </Link>
      </div>

      <div className="max-w-xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            {t('reports.wizardTitle')}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t('reports.wizardSubtitle')}
          </p>
        </div>

        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4 text-xs font-semibold">
          <span className={step === 1 ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-400'}>1. {t('reports.stepBasicDetails')}</span>
          <span className="text-zinc-300 dark:text-zinc-800">/</span>
          <span className={step === 2 ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-400'}>2. {t('reports.stepIngestDocument')}</span>
          <span className="text-zinc-300 dark:text-zinc-800">/</span>
          <span className={step === 3 ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-400'}>3. {t('reports.stepProcessingEngine')}</span>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="card">
              <form onSubmit={handleSubmit(onMetadataSubmit)} className="space-y-4">
                <div>
                  <label className="label">{t('reports.reportTitle')}</label>
                  <input
                    type="text"
                    placeholder={t('reports.reportTitlePlaceholder')}
                    className="input"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">{t('reports.scopeContext')}</label>
                  <textarea
                    placeholder={t('reports.scopeContextPlaceholder')}
                    rows={3}
                    className="input resize-none py-2"
                    {...register('description')}
                  />
                </div>


                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary h-10 w-full sm:w-auto cursor-pointer"
                  >
                    {isSubmitting ? t('reports.initializing') : t('reports.proceedToUpload')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="card bg-zinc-50/40 dark:bg-zinc-900/10 border-zinc-150 p-4 rounded-xl text-xs space-y-1">
                <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase">{t('reports.step2Scope')}</span>
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200">{t('reports.step2Title')}</h4>
                <p className="text-zinc-500 dark:text-zinc-400 leading-normal">
                  {t('reports.step2Description')}
                </p>
              </div>

              <FileUploadCard onFileSelect={handleFileSelect} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <UploadProgress
                progress={activeProgress}
                state={activeState}
                error={errorMessage}
              />

              {activeState === 'completed' && (
                <div className="flex justify-end pt-2">
                  <Link
                    to={`/reports/${createdReportId}`}
                    className="btn-primary h-10 gap-1.5 w-full sm:w-auto text-center font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    {t('reports.inspectAnalytics')}
                  </Link>
                </div>
              )}

              {activeState === 'failed' && (
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="btn-secondary h-10 cursor-pointer"
                  >
                    {t('reports.tryUploadAgain')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
export default CreateReportPage
