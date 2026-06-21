import React, { useState } from 'react'
import { Mail, UserPlus, Trash2, Shield, X, Plus, Send } from 'lucide-react'
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
  useCancelInvitation
} from '../hooks/useMembers'
import { formatDate } from '../lib/utils'
import { LoadingState } from '../components/reports/LoadingState'

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['owner', 'admin', 'member']),
})

export function MembersPage() {
  const { addToast } = useUIStore()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const { data: membersData, isLoading: membersLoading, error: membersError } = useMembers({ limit: 50, offset: 0 })
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()
  
  // Invitation Hooks
  const { data: invitations = [], isLoading: invitationsLoading } = useInvitations()
  const inviteMember = useInviteMember()
  const resendInvite = useResendInvitation()
  const cancelInvite = useCancelInvitation()

  const members = membersData?.items || []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'member' },
  })

  const onInviteSubmit = async (formData) => {
    try {
      await inviteMember.mutateAsync({ email: formData.email, role: formData.role })
      setIsInviteOpen(false)
      reset()
    } catch (err) {
      // Error handled in mutation hook toast
    }
  }

  const handleRemoveMember = async (member) => {
    if (!window.confirm('Remove this member from the workspace?')) return
    try {
      await removeMember.mutateAsync(member.user_id)
    } catch (err) {
      // Error handled in mutation hook toast
    }
  }

  const handleChangeRole = async (memberId, role) => {
    try {
      await updateRole.mutateAsync({ memberId, role })
    } catch (err) {
      // Error handled in mutation hook toast
    }
  }

  const handleResendInvitation = async (invitationId) => {
    try {
      await resendInvite.mutateAsync(invitationId)
    } catch (err) {
      // Error handled in mutation hook toast
    }
  }

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return
    try {
      await cancelInvite.mutateAsync(invitationId)
    } catch (err) {
      // Error handled in mutation hook toast
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Team Directory</h1>
          <p className="text-sm text-zinc-500 mt-1">Govern user access limits, invite new members, and adjust workspace roles.</p>
        </div>
        <button onClick={() => setIsInviteOpen(true)} className="btn-primary h-10 gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Active Members Card */}
      <div className="card p-0 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
          <h2 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">Active Workspace Members</h2>
        </div>
        {membersLoading ? (
          <div className="p-4"><LoadingState type="table" count={3} /></div>
        ) : membersError ? (
          <div className="p-10 text-center text-sm text-red-500">{membersError.message}</div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">No members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Member ID</th>
                  <th className="py-3.5 px-6">User ID</th>
                  <th className="py-3.5 px-6">Role Scope</th>
                  <th className="py-3.5 px-6">Joined Date</th>
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
                          onChange={(event) => handleChangeRole(member.id, event.target.value)}
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
                      <button onClick={() => handleRemoveMember(member)} className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer" title="Remove member access">
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

      {/* Pending Invitations Section */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
          <h2 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">Pending Team Invitations</h2>
        </div>
        {invitationsLoading ? (
          <div className="p-4"><LoadingState type="table" count={2} /></div>
        ) : invitations.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-500">No pending invitations found. Invite teammates to join.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Role Scope</th>
                  <th className="py-3.5 px-6">Invitation Status</th>
                  <th className="py-3.5 px-6">Sent Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100 text-xs">{inv.email}</td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs capitalize">{inv.role}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/30 uppercase tracking-wider animate-pulse">
                        Pending
                      </span>
                    </td>
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs font-mono">{formatDate(inv.created_at)}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button 
                        onClick={() => handleResendInvitation(inv.id)} 
                        className="btn-secondary h-8 px-2.5 text-[10px] cursor-pointer"
                        disabled={resendInvite.isPending}
                      >
                        Resend
                      </button>
                      <button 
                        onClick={() => handleCancelInvitation(inv.id)} 
                        className="btn-danger h-8 px-2.5 text-[10px] cursor-pointer"
                        disabled={cancelInvite.isPending}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-[420px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5 border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Invite Team Member</h3>
              </div>
              <button onClick={() => setIsInviteOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
              <div>
                <label className="label">Recipient Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input type="email" placeholder="colleague@company.com" className="input pl-10" {...register('email')} />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                <p className="mt-1.5 text-[11px] text-zinc-450 dark:text-zinc-500 leading-normal">
                  An invitation token will be prepared and sent to this email address to authorize workspace registration.
                </p>
              </div>

              <div>
                <label className="label">Workspace Access Role</label>
                <select className="input cursor-pointer" {...register('role')}>
                  <option value="member">Member (Read & Upload)</option>
                  <option value="admin">Admin (Manage Configuration)</option>
                  <option value="owner">Owner (Full Control & Billing)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsInviteOpen(false)} className="btn-secondary h-10 cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting || inviteMember.isPending} className="btn-primary h-10 cursor-pointer justify-center gap-2">
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting || inviteMember.isPending ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default MembersPage
