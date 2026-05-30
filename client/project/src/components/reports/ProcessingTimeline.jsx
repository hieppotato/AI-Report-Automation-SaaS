import React from 'react'
import { Check, Loader2, Play, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ProcessingTimeline({ progress = 0, status = 'draft', currentStep = '', errorMessage = '' }) {
  const normalizedStatus = (status || 'draft').toLowerCase()
  
  const steps = [
    { key: 'uploading', label: 'Uploading File', minProgress: 10 },
    { key: 'parsing', label: 'Parsing Data', minProgress: 30 },
    { key: 'summary', label: 'Generating Summary', minProgress: 50 },
    { key: 'insights', label: 'Generating Insights', minProgress: 70 },
    { key: 'charts', label: 'Building Charts', minProgress: 90 },
    { key: 'completed', label: 'Completed', minProgress: 100 },
  ]

  // If failed, find where it failed based on current progress
  const getStepState = (step, idx) => {
    if (normalizedStatus === 'failed') {
      // Find the first step that was not completed
      const failedIdx = steps.findIndex(s => progress < s.minProgress)
      const currentFailedIdx = failedIdx === -1 ? steps.length - 1 : failedIdx
      
      if (idx < currentFailedIdx) {
        return 'completed'
      } else if (idx === currentFailedIdx) {
        return 'failed'
      } else {
        return 'pending'
      }
    }

    if (normalizedStatus === 'completed') {
      return 'completed'
    }

    // Active or Pending
    // We find the current active step index based on progress
    const activeIdx = steps.findIndex(s => progress < s.minProgress)
    const currentActiveIdx = activeIdx === -1 ? steps.length - 1 : activeIdx

    if (idx < currentActiveIdx) {
      return 'completed'
    } else if (idx === currentActiveIdx && normalizedStatus !== 'draft') {
      return 'active'
    } else {
      return 'pending'
    }
  }

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
        <div>
          <h4 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">AI Pipeline Status</h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">Real-time status updates from backend worker nodes.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded">
            {progress}%
          </span>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 border-l border-zinc-200 dark:border-zinc-800 ml-3">
        {steps.map((step, idx) => {
          const state = getStepState(step, idx)
          const isLast = idx === steps.length - 1

          return (
            <div key={step.key} className="relative flex items-start gap-4 group">
              {/* Timeline dot / icon */}
              <div className="absolute -left-[31px] top-0 flex items-center justify-center">
                {state === 'completed' && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-white dark:ring-zinc-950 transition-colors">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                {state === 'active' && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm ring-4 ring-white dark:ring-zinc-950 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin stroke-[2.5]" />
                  </div>
                )}
                {state === 'failed' && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm ring-4 ring-white dark:ring-zinc-950">
                    <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
                {state === 'pending' && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 ring-4 ring-white dark:ring-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "text-xs font-semibold",
                    state === 'completed' && "text-zinc-800 dark:text-zinc-200",
                    state === 'active' && "text-brand-600 dark:text-brand-400",
                    state === 'failed' && "text-rose-600 dark:text-rose-450",
                    state === 'pending' && "text-zinc-400 dark:text-zinc-500"
                  )}>
                    {step.label}
                  </span>
                  {state === 'active' && currentStep && (
                    <span className="text-[10px] font-mono text-zinc-450 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-900 px-1.5 py-0.5 rounded">
                      {currentStep}
                    </span>
                  )}
                </div>
                {state === 'failed' && errorMessage && (
                  <p className="mt-1 text-[11px] font-normal leading-relaxed text-rose-500">
                    Error details: {errorMessage}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProcessingTimeline
