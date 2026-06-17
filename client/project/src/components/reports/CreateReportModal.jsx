import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Sparkles } from 'lucide-react'

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
})

export function CreateReportModal({ isOpen, onClose, onCreate }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  })

  if (!isOpen) return null

  const onSubmit = async (data) => {
    await onCreate(data)
    reset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-[440px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5 border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Create New AI Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Report Title</label>
            <input
              type="text"
              placeholder="e.g. Q2 Transaction Analysis"
              className="input"
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              placeholder="Brief context about this sales analysis..."
              rows={3}
              className="input resize-none py-2"
              {...register('description')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary h-10 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary h-10 cursor-pointer"
            >
              {isSubmitting ? 'Initializing...' : 'Create & Proceed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateReportModal
