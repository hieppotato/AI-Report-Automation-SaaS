import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Clock, Loader2, ArrowRight, RefreshCw } from 'lucide-react'
import { AuthLayout } from '../components/layout/AuthLayout'
import { acceptInvitation } from '../api/invitations'
import { useAuthStore } from '../store/authStore'

// Maps backend error messages to user-friendly descriptions
function parseInvitationError(err) {
  const raw = err?.message || ''
  if (raw.includes('expired')) {
    return {
      title: 'Invitation Expired',
      message: 'This invitation link has expired. Please ask the workspace admin to resend the invitation.',
      hint: 'Invitation links are valid for 7 days.',
    }
  }
  if (raw.includes('email does not match') || raw.includes('email mismatch')) {
    return {
      title: 'Email Mismatch',
      message: "This invitation was sent to a different email address than the one you're signed in with.",
      hint: 'Sign in with the email address that received the invitation.',
    }
  }
  if (raw.includes('no longer pending') || raw.includes('already accepted')) {
    return {
      title: 'Already Used',
      message: 'This invitation has already been accepted. You may already be a member of this workspace.',
      hint: null,
    }
  }
  if (raw.includes('not found')) {
    return {
      title: 'Invalid Invitation',
      message: 'This invitation link is invalid or has been cancelled.',
      hint: 'Please request a new invitation from the workspace admin.',
    }
  }
  return {
    title: 'Invitation Failed',
    message: raw || 'An unexpected error occurred while accepting the invitation.',
    hint: null,
  }
}

export function InvitationAcceptPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [errorInfo, setErrorInfo] = useState(null)
  const [countdown, setCountdown] = useState(3)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorInfo({
        title: 'Invalid Link',
        message: 'No invitation token was found in this URL.',
        hint: 'Check that you copied the full link from your email.',
      })
      return
    }

    if (!session) {
      // Not logged in — send to register (or login) so they can come back
      navigate(`/register?invite_token=${token}`, { replace: true })
      return
    }

    const accept = async () => {
      try {
        await acceptInvitation({ token })
        setStatus('success')
      } catch (err) {
        setStatus('error')
        setErrorInfo(parseInvitationError(err))
      }
    }

    accept()
  }, [token, session, navigate])

  // Auto-redirect countdown on success
  useEffect(() => {
    if (status !== 'success') return
    if (countdown <= 0) {
      navigate('/dashboard', { replace: true })
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [status, countdown, navigate])

  return (
    <AuthLayout title="Workspace Invitation" subtitle="">
      <div className="flex flex-col items-center text-center py-8 px-2">

        {/* ── Loading ── */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-spin" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 mb-1">Accepting your invitation</h2>
              <p className="text-sm text-zinc-500">Verifying token and joining workspace…</p>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 mb-1">You've joined the workspace!</h2>
              <p className="text-sm text-zinc-500">Welcome aboard. Redirecting you to the dashboard…</p>
            </div>

            {/* Countdown bar */}
            <div className="w-full max-w-[260px]">
              <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mt-2">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Redirecting in {countdown}s…</p>
            </div>

            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="btn-primary h-9 px-5 gap-2 mt-1"
            >
              Go to Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && errorInfo && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 mb-1">{errorInfo.title}</h2>
              <p className="text-sm text-zinc-500 max-w-[300px] mx-auto leading-relaxed">{errorInfo.message}</p>
              {errorInfo.hint && (
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600 max-w-[280px] mx-auto leading-relaxed">
                  💡 {errorInfo.hint}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="btn-secondary h-9 px-5"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/dashboard', { replace: true })}
                className="btn-primary h-9 px-5 gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

export default InvitationAcceptPage
