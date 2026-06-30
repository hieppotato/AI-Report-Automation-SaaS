import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '../components/layout/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { acceptInvitation } from '../api/invitations'
import { useUIStore } from '../store/uiStore'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite_token')
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const { login } = useAuth()
  const { addToast } = useUIStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await login(data)
      if (inviteToken) {
        try {
          await acceptInvitation({ token: inviteToken })
          addToast('Invitation accepted!', 'success')
        } catch (acceptError) {
          addToast('Logged in successfully, but could not accept invitation.', 'warning')
        }
      }
      navigate('/dashboard')
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <AuthLayout title={t('auth.welcomeBack')} subtitle={t('auth.signInSubtitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {serverError}
          </div>
        )}

        <div>
          <label className="label">{t('auth.email')}</label>
          <input type="email" placeholder={t('auth.emailPlaceholder')} className="input" autoComplete="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">{t('auth.password')}</label>
            <Link to="/forgot-password" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="input pr-10"
              autoComplete="current-password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-9 mt-1">
          {isSubmitting ? t('auth.signInLoading') : t('auth.signIn')}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
          {t('auth.createAccount')}
        </Link>
      </p>
    </AuthLayout>
  )
}
