import React, { useState, useCallback } from 'react'
import {
  Mail, UserPlus, Trash2, Shield, X, Plus, Send,
  Copy, RotateCcw, Ban, CheckCircle2, Clock, AlertCircle,
  Check, Link2
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useUIStore } from '../store/uiStore'
import {
  useMembers,
  useRemoveMember,
  useUpdateMemberRole,
  useInvitations,
  useInviteMember,
  useResendInvitation,
  useCancelInvitation,
  useMyPendingInvitations,
  useAcceptMyInvitation,
} from '../hooks/useMembers'
import { formatDate } from '../lib/utils'
import { LoadingState } from '../components/reports/LoadingState'

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['admin', 'member']),
})

// ─── Status Badge ────────────────────────────────────────────────────────────
function InvitationStatusBadge({ status }) {
  const config = {
    pending: {
      label: 'Pending Acceptance',
      dot: 'bg-amber-400 animate-pulse',
      pill: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
    },
    accepted: {
      label: 'Accepted',
      dot: 'bg-emerald-500',
      pill: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
    },
    expired: {
      label: 'Expired',
      dot: 'bg-zinc-400 dark:bg-zinc-600',
      pill: 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-500 border-zinc-200/60 dark:border-zinc-700/40',
    },
    cancelled: {
      label: 'Cancelled',
      dot: 'bg-rose-400',
      pill: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40',
    },
  }

  const c = config[status] || config.expired

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${c.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

// ─── Action Buttons per Status ────────────────────────────────────────────────
function InvitationActions({ inv, onCopyLink, onResend, onCancel, resendPending, cancelPending }) {
  if (inv.status === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-600">
        <CheckCircle2 className="w-3 h-3" />
        Member joined
      </span>
    )
  }

  if (inv.status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-600">
        <Ban className="w-3 h-3" />
        Cancelled
      </span>
    )
  }

  if (inv.status === 'expired') {
    return (
      <button
        onClick={() => onResend(inv.id)}
        disabled={resendPending}
        className="btn-secondary h-7 px-2.5 text-[10px] gap-1.5 cursor-pointer"
        title="Resend invitation email"
      >
        <RotateCcw className="w-3 h-3" />
        Resend
      </button>
    )
  }

  // pending
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <button
        onClick={() => onCopyLink(inv.accept_url, inv.email)}
        className="btn-secondary h-7 px-2.5 text-[10px] gap-1.5 cursor-pointer"
        title="Copy invitation link"
      >
        <Link2 className="w-3 h-3" />
        Copy Link
      </button>
      <button
        onClick={() => onResend(inv.id)}
        disabled={resendPending}
        className="btn-secondary h-7 px-2.5 text-[10px] gap-1.5 cursor-pointer"
        title="Resend invitation email"
      >
        <RotateCcw className="w-3 h-3" />
        Resend
      </button>
      <button
        onClick={() => onCancel(inv.id)}
        disabled={cancelPending}
        className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
        title="Cancel invitation"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ onClose, inviteMember }) {
  const [serverErrors, setServerErrors] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'member' },
  })

  const onSubmit = async (formData) => {
    setServerErrors(null)
    try {
      await inviteMember.mutateAsync({ email: formData.email, role: formData.role })
      reset()
      onClose()
    } catch (err) {
      // Surface backend validation detail or general message
      const detail = err?.details
      if (detail && typeof detail === 'object') {
        setServerErrors(Object.values(detail).flat().join(' '))
      } else {
        setServerErrors(err?.message || 'Failed to send invitation. Please try again.')
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[440px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center">
              <UserPlus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Invite Team Member</h3>
              <p className="text-[11px] text-zinc-500 leading-none mt-0.5">They'll receive an email with a secure link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Server Error */}
        {serverErrors && (
          <div className="mb-4 flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{serverErrors}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Recipient Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                className="input pl-10"
                autoComplete="off"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.email.message}
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-zinc-500 leading-relaxed">
              A secure invitation link will be emailed to authorize workspace access.
            </p>
          </div>

          <div>
            <label className="label">Workspace Role</label>
            <select id="invite-role" className="input cursor-pointer" {...register('role')}>
              <option value="member">Member — Read &amp; Upload</option>
              <option value="admin">Admin — Manage Configuration</option>
            </select>
            <p className="mt-1.5 text-[11px] text-zinc-500">
              Ownership can be transferred after the member joins.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary h-9 px-4 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="invite-submit-btn"
              type="submit"
              disabled={isSubmitting || inviteMember.isPending}
              className="btn-primary h-9 px-4 cursor-pointer gap-2 min-w-[130px]"
            >
              {isSubmitting || inviteMember.isPending ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function MembersPage() {
  const { addToast } = useUIStore()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const { data: membersData, isLoading: membersLoading, error: membersError } = useMembers({ limit: 50, offset: 0 })
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()

  const { data: invitations = [], isLoading: invitationsLoading } = useInvitations()
  const inviteMember = useInviteMember()
  const resendInvite = useResendInvitation()
  const cancelInvite = useCancelInvitation()

  const { data: myPendingInvites = [], isLoading: myInvitesLoading } = useMyPendingInvitations()
  const acceptInvite = useAcceptMyInvitation()

  const members = membersData?.items || []

  const handleRemoveMember = async (member) => {
    if (!window.confirm('Remove this member from the workspace?')) return
    try {
      await removeMember.mutateAsync(member.user_id)
    } catch (_) {}
  }

  const handleChangeRole = async (memberId, role) => {
    try {
      await updateRole.mutateAsync({ memberId, role })
    } catch (_) {}
  }

  const handleResendInvitation = async (invitationId) => {
    try {
      await resendInvite.mutateAsync(invitationId)
    } catch (_) {}
  }

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Cancel this invitation? The link will stop working.')) return
    try {
      await cancelInvite.mutateAsync(invitationId)
    } catch (_) {}
  }

  const handleCopyLink = useCallback(async (acceptUrl, email) => {
    if (!acceptUrl) {
      addToast('Invitation link not available.', 'error')
      return
    }
    try {
      await navigator.clipboard.writeText(acceptUrl)
      setCopiedId(email)
      addToast('Invitation link copied to clipboard!', 'success')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      addToast('Could not copy link. Please copy manually.', 'error')
    }
  }, [addToast])

  // Partition invitations for the summary strip
  const pendingCount = invitations.filter((i) => i.status === 'pending').length
  const acceptedCount = invitations.filter((i) => i.status === 'accepted').length
  const expiredCount = invitations.filter((i) => i.status === 'expired').length

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Team Directory</h1>
          <p className="text-sm text-zinc-500 mt-1">Govern user access, invite new members, and manage workspace roles.</p>
        </div>
        <button
          id="invite-member-btn"
          onClick={() => setIsInviteOpen(true)}
          className="btn-primary h-10 gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Your Pending Invitations */}
      {!myInvitesLoading && myPendingInvites.length > 0 && (
        <div className="mb-6 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/30 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/50">
                <UserPlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">You have pending invitations</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Accept an invitation to join a workspace.</p>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {myPendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-900/50 border border-brand-100 dark:border-brand-900/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{inv.organization_name}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 capitalize">{inv.role}</span>
                </div>
                <button
                  onClick={() => acceptInvite.mutate(inv.token)}
                  disabled={acceptInvite.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Members Card */}
      <div className="card p-0 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
          <h2 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">Active Workspace Members</h2>
        </div>
        {membersLoading ? (
          <div className="p-4"><LoadingState type="table" count={3} /></div>
        ) : membersError ? (
          <div className="p-10 text-center text-sm text-rose-500">{membersError.message}</div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">No members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Member ID</th>
                  <th className="py-3.5 px-6">User ID</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Joined</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100 font-mono text-xs">{member.id}</td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 font-mono text-xs">{member.user_id}</td>
                    <td className="py-4 px-6">
                      <div className="relative inline-block">
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(member.id, e.target.value)}
                          className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer appearance-none pr-7 focus:outline-none"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                        <Shield className="w-3 h-3 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs font-mono">{formatDate(member.created_at)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Invitation Center ──────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        {/* Header with summary pills */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">
            Invitation Center
          </h2>
          {invitations.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {pendingCount} pending
                </span>
              )}
              {acceptedCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {acceptedCount} accepted
                </span>
              )}
              {expiredCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900/40 text-zinc-500 border border-zinc-200/60 dark:border-zinc-700/30 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  {expiredCount} expired
                </span>
              )}
            </div>
          )}
        </div>

        {invitationsLoading ? (
          <div className="p-4"><LoadingState type="table" count={2} /></div>
        ) : invitations.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No invitations yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Invite teammates using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Sent</th>
                  <th className="py-3.5 px-6">Expires</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-3 h-3 text-zinc-400" />
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">{inv.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize font-medium">{inv.role}</span>
                    </td>
                    <td className="py-4 px-6">
                      <InvitationStatusBadge status={inv.status} />
                    </td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs font-mono">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs font-mono">
                      {inv.expires_at ? formatDate(inv.expires_at) : '—'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <InvitationActions
                        inv={inv}
                        onCopyLink={handleCopyLink}
                        onResend={handleResendInvitation}
                        onCancel={handleCancelInvitation}
                        resendPending={resendInvite.isPending}
                        cancelPending={cancelInvite.isPending}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <InviteModal
          onClose={() => setIsInviteOpen(false)}
          inviteMember={inviteMember}
        />
      )}
    </DashboardLayout>
  )
}

export default MembersPage
