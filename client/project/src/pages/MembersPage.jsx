import React, { useState } from 'react'
import {
  UserPlus,
  Mail,
  Trash2,
  Shield,
  X,
  Plus
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useUIStore } from '../store/uiStore'

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['Admin', 'Analyst', 'Viewer']),
})

export function MembersPage() {
  const { addToast } = useUIStore()
  const [members, setMembers] = useState([
    { id: '1', name: 'Alice Johnson', email: 'alice@acme.com', role: 'Admin', joinedDate: '2026-01-15' },
    { id: '2', name: 'Bob Smith', email: 'bob@acme.com', role: 'Analyst', joinedDate: '2026-02-10' },
    { id: '3', name: 'Charlie Davis', email: 'charlie@acme.com', role: 'Viewer', joinedDate: '2026-04-01' },
  ])
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'Analyst' }
  })

  const onInviteSubmit = async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    const newMember = {
      id: Math.random().toString(36).substring(2, 9),
      name: data.email.split('@')[0],
      email: data.email,
      role: data.role,
      joinedDate: new Date().toISOString().split('T')[0],
    }

    setMembers([...members, newMember])
    addToast(`Invitation sent to ${data.email}!`, 'success')
    setIsInviteOpen(false)
    reset()
  }

  const handleRemoveMember = (id, name) => {
    const confirm = window.confirm(`Are you sure you want to remove ${name} from this workspace?`)
    if (confirm) {
      setMembers(members.filter((m) => m.id !== id))
      addToast(`Member ${name} removed successfully.`, 'success')
    }
  }

  const handleChangeRole = (id, newRole) => {
    setMembers(members.map((m) => m.id === id ? { ...m, role: newRole } : m))
    addToast(`Role updated successfully.`, 'success')
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Team Directory</h1>
          <p className="text-sm text-zinc-500 mt-1">Govern user access limits, invite analysts, and adjust workspace roles.</p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="btn-primary h-10 gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Email Address</th>
                <th className="py-3.5 px-6">Role Scope</th>
                <th className="py-3.5 px-6">Joined Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {members.map((mem) => (
                <tr key={mem.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                  <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100">
                    {mem.name}
                  </td>
                  <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                    {mem.email}
                  </td>
                  <td className="py-4 px-6">
                    <div className="relative inline-block">
                      <select
                        value={mem.role}
                        onChange={(e) => handleChangeRole(mem.id, e.target.value)}
                        className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer appearance-none pr-6 focus:outline-none"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Analyst">Analyst</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                      <Shield className="w-3 h-3 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </td>
                  <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs font-mono">
                    {mem.joinedDate}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleRemoveMember(mem.id, mem.name)}
                      disabled={mem.role === 'Admin' && members.filter((m) => m.role === 'Admin').length === 1}
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Remove member access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-[420px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5 border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Invite Workspace Member</h3>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
              <div>
                <label className="label">Member Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="analyst@acme.com"
                    className="input pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Access Role Level</label>
                <select
                  className="input cursor-pointer"
                  {...register('role')}
                >
                  <option value="Admin">Admin (Full administrative power)</option>
                  <option value="Analyst">Analyst (Ingest and update reports)</option>
                  <option value="Viewer">Viewer (ReadOnly report lookups)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="btn-secondary h-10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary h-10 cursor-pointer"
                >
                  {isSubmitting ? 'Sending invitation…' : 'Send Invitation'}
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
