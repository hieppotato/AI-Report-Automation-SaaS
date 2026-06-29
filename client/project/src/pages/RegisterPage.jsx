import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { AuthLayout } from '../components/layout/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store/uiStore'
import { acceptInvitation } from '../api/invitations'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite_token')
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const { addToast } = useUIStore()
  const { register: registerAccount, login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const result = await registerAccount(data)

      if (inviteToken) {
        if (result.session) {
          try {
            await acceptInvitation({ token: inviteToken })
            addToast('Account created and invitation accepted!', 'success')
            navigate('/dashboard', { replace: true })
          } catch (acceptError) {
            navigate(`/invitations/accept?token=${inviteToken}`, { replace: true })
          }
        } else {
          addToast('Please confirm your email first, then accept the invitation.', 'info')
          navigate('/login')
        }
      } else {
        if (result.session) {
          addToast('Registration successful!', 'success')
          navigate('/dashboard')
        } else {
          addToast('Registration successful. Please check your email to confirm.', 'success')
          navigate('/login')
        }
      }
    } catch (error) {
      const msg = error.message || ''
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setServerError('An account with this email already exists. Please sign in instead.')
      } else {
        setServerError(msg)
      }
    }
  }

  return (
    <AuthLayout
      title={inviteToken ? 'Create your account to join' : 'Create your account'}
      subtitle={inviteToken ? "You've been invited to join a workspace" : 'Begin your journey with Reportly today'}
    >
      {inviteToken && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-brand-50 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-800/40 text-brand-700 dark:text-brand-400 text-xs">
          You've been invited to join a workspace. Create an account to accept.
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {serverError}
          </div>
        )}

        <div>
          <label className="label">Full Name</label>
          <input type="text" placeholder="Alex Johnson" className="input" {...register('fullName')} />
          {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="label">Email Address</label>
          <input type="email" placeholder="you@company.com" className="input" autoComplete="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="input pr-10"
              autoComplete="new-password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-9 mt-1">
          {isSubmitting ? 'Creating account...' : inviteToken ? 'Create Account & Join' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Already have an account?{' '}
        <Link to={inviteToken ? `/login?invite_token=${inviteToken}` : "/login"} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default RegisterPage