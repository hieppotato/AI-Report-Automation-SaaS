import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useUIStore } from '../store/uiStore'
import { useOrgStore } from '../store/orgStore'
import { useUploadFile } from '../hooks/useUpload'
import { useTranslation } from 'react-i18next'

export function UploadPage() {
  const { addToast } = useUIStore()
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const uploadFileMutation = useUploadFile()
  const { t } = useTranslation()
  const [file, setFile] = useState(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadState, setUploadState] = useState('idle') // idle, uploading, success, error
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return
    
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase()
    const allowedExtensions = ['csv', 'xlsx', 'xls']
    
    if (!allowedExtensions.includes(fileExtension)) {
      addToast(t('upload.invalidFormat'), 'error')
      setUploadState('error')
      setFile(null)
      return
    }

    setFile({
      name: selectedFile.name,
      size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
      type: fileExtension.toUpperCase(),
      raw: selectedFile,
    })
    setUploadState('idle')
    setUploadProgress(0)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleUploadSubmit = async () => {
    if (!file) return
    if (!activeOrg?.id) {
      addToast(t('upload.selectWorkspace'), 'error')
      return
    }

    setUploadState('uploading')
    setUploadProgress(0)

    try {
      await uploadFileMutation.mutateAsync({
        file: file.raw,
        onProgress: setUploadProgress,
      })

      setUploadProgress(100)
      setUploadState('success')
      addToast(`Report file "${file.name}" uploaded successfully.`, 'success')
    } catch (error) {
      setUploadState('error')
      addToast(error.message, 'error')
    }
  }

  const handleClear = () => {
    setFile(null)
    setUploadState('idle')
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">{t('upload.title')}</h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          {t('upload.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`card border-dashed flex flex-col items-center justify-center p-10 text-center transition-all duration-200 min-h-[280px] select-none ${
              isDragActive
                ? 'border-brand-400 dark:border-brand-500 bg-brand-50/20 dark:bg-brand-950/10 scale-[1.01]'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />

            {!file ? (
              <>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 mb-4">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {t('upload.dragDrop')}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {t('upload.supportedFormats')}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary h-8 mt-4 text-xs"
                >
                  {t('upload.browseFiles')}
                </button>
              </>
            ) : (
              <div className="w-full space-y-5">
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/10 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5 uppercase">
                        {file.type} • {file.size}
                      </p>
                    </div>
                  </div>
                  {uploadState !== 'uploading' && (
                    <button
                      onClick={handleClear}
                      className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {uploadState === 'uploading' && (
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                        {t('upload.ingesting')}
                      </span>
                      <span className="font-mono">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all duration-100"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadState === 'success' && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-950/20 bg-emerald-50/10 dark:bg-emerald-950/5 text-left text-sm text-emerald-800 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs text-emerald-800 dark:text-emerald-400">{t('upload.processingComplete')}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                        {t('upload.processingCompleteMsg')}
                      </p>
                    </div>
                  </div>
                )}

                {uploadState === 'error' && (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 dark:border-red-950/20 bg-red-50/10 dark:bg-red-950/5 text-left text-sm text-red-800 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs">{t('upload.uploadFailed')}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                        {t('upload.uploadFailedMsg')}
                      </p>
                    </div>
                  </div>
                )}

                {uploadState === 'idle' && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={handleClear}
                      className="btn-secondary h-9 text-xs"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleUploadSubmit}
                      className="btn-primary h-9 gap-1.5 text-xs"
                    >
                      {t('upload.startAnalysis')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {uploadState === 'success' && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={handleClear}
                      className="btn-secondary h-9 text-xs"
                    >
                      {t('upload.uploadAnother')}
                    </button>
                    <Link
                      to="/reports"
                      className="btn-primary h-9 gap-1.5 text-xs"
                    >
                      {t('upload.viewReports')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 mb-3 uppercase tracking-wider">{t('upload.ingestionGuide')}</h3>
            <div className="space-y-3 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              <p>
                {t('upload.ensureColumns')}
              </p>
              
              <ul className="space-y-2 font-medium text-zinc-700 dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="h-1 w-1 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span><strong>{t('upload.date')}</strong>{t('upload.dateFormat')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1 w-1 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span><strong>{t('upload.salesValue')}</strong>{t('upload.salesValueDesc')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1 w-1 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span><strong>{t('upload.quantity')}</strong>{t('upload.quantityDesc')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1 w-1 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span><strong>{t('upload.category')}</strong>{t('upload.categoryDesc')}</span>
                </li>
              </ul>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-3">
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  {t('upload.missingColumnsNote')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
export default UploadPage
