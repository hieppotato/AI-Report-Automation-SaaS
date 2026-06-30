import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '../components/layout/AuthLayout'
import { supabase } from '../lib/supabase'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    setSuccess(false)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/profile`,
    })
    
    if (error) {
      setServerError(error.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <AuthLayout title={t('auth.resetPassword')} subtitle={t('auth.resetPasswordSubtitle')}>
      {success ? (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t('auth.emailSent')}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-normal">
              {t('auth.emailSentMessage')}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backToSignIn')}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {serverError}
            </div>
          )}

          <div>
            <label className="label">{t('auth.emailAddress')}</label>
            <input
              type="email"
              placeholder="you@company.com"
              className="input"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full h-10 mt-2"
          >
            {isSubmitting ? t('auth.sendingInstructions') : t('auth.sendRecoveryLink')}
          </button>

          <p className="mt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backToSignIn')}
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
export default ForgotPasswordPage
