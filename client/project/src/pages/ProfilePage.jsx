import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, ShieldCheck } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { supabase } from '../lib/supabase'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().optional(),
  timezone: z.string().optional(),
})

const securitySchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})

export function ProfilePage() {
  const { profile, updateProfile } = useAuthStore()
  const { addToast } = useUIStore()
  const { data: profileData, isLoading } = useProfile()
  const updateProfileMutation = useUpdateProfile()

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.fullName || '',
      companyName: profile?.companyName || '',
      timezone: profile?.timezone || '',
    },
  })

  const {
    register: registerSecurity,
    handleSubmit: handleSecuritySubmit,
    reset: resetSecurity,
    formState: { errors: securityErrors, isSubmitting: isSecuritySubmitting },
  } = useForm({
    resolver: zodResolver(securitySchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!profile) return
    resetProfile({
      fullName: profile.fullName || '',
      companyName: profile.companyName || '',
      timezone: profile.timezone || '',
    })
  }, [profile, profileData, resetProfile])

  const onProfileUpdate = async (data) => {
    try {
      await updateProfileMutation.mutateAsync(data)
      await supabase.auth.updateUser({ data: { full_name: data.fullName } })
      updateProfile(data)
      addToast('Profile attributes updated successfully.', 'success')
    } catch (error) {
      addToast(error.message, 'error')
    }
  }

  const onSecurityUpdate = async (data) => {
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      addToast(error.message, 'error')
    } else {
      addToast('Password updated successfully.', 'success')
      resetSecurity()
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Account Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Govern personal metadata, security configurations, and credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mb-4">Profile Details</h3>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-48 rounded bg-zinc-100 dark:bg-zinc-850" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-10 w-full rounded bg-zinc-100 dark:bg-zinc-850" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-10 w-full rounded bg-zinc-100 dark:bg-zinc-850" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200/30 text-brand-600 dark:text-brand-400 font-bold text-xl select-none shadow-sm">
                    {(profile?.fullName || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Avatar Image</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Avatar initials calculated dynamically from full name.</p>
                  </div>
                </div>

                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="text" placeholder="John Doe" className="input pl-10" {...registerProfile('fullName')} />
                  </div>
                  {profileErrors.fullName && <p className="mt-1 text-xs text-red-500">{profileErrors.fullName.message}</p>}
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input type="email" value={profile?.email || ''} disabled className="input pl-10 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 cursor-not-allowed border-dashed" />
                  </div>
                </div>

                <div>
                  <label className="label">Company Name</label>
                  <input type="text" placeholder="Acme Corp" className="input" {...registerProfile('companyName')} />
                </div>

                <div>
                  <label className="label">Timezone</label>
                  <input type="text" placeholder="Asia/Bangkok" className="input" {...registerProfile('timezone')} />
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={isProfileSubmitting || updateProfileMutation.isPending} className="btn-primary h-10 cursor-pointer">
                    {isProfileSubmitting || updateProfileMutation.isPending ? 'Saving profile...' : 'Save Details'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mb-4">Security & Credentials</h3>
            <form onSubmit={handleSecuritySubmit(onSecurityUpdate)} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input type="password" placeholder="••••••••" className="input pl-10" autoComplete="new-password" {...registerSecurity('password')} />
                </div>
                {securityErrors.password && <p className="mt-1 text-xs text-red-500">{securityErrors.password.message}</p>}
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input type="password" placeholder="••••••••" className="input pl-10" autoComplete="new-password" {...registerSecurity('confirmPassword')} />
                </div>
                {securityErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{securityErrors.confirmPassword.message}</p>}
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSecuritySubmitting} className="btn-primary h-10 cursor-pointer">
                  {isSecuritySubmitting ? 'Updating credentials...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Account Security</h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your account session is managed by Supabase Auth and API requests are authorized with your access token.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ProfilePage
