import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2, ShieldAlert, Check } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useOrgStore } from '../store/orgStore'
import { useUIStore } from '../store/uiStore'

const schema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'),
})

export function OrgSettingsPage() {
  const navigate = useNavigate()
  const { activeOrg, setActiveOrg, organizations, setOrganizations } = useOrgStore()
  const { addToast } = useUIStore()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: activeOrg?.name || '',
      slug: activeOrg?.slug || '',
    }
  })

  const onSubmit = async (data) => {
    if (!activeOrg) return

    await new Promise((resolve) => setTimeout(resolve, 800))
    
    const updatedOrg = { ...activeOrg, name: data.name, slug: data.slug }
    const updatedList = organizations.map((o) => o.id === activeOrg.id ? updatedOrg : o)
    
    setOrganizations(updatedList)
    setActiveOrg(updatedOrg)
    addToast('Workspace parameters updated successfully!', 'success')
  }

  const handleDeleteWorkspace = async () => {
    if (!activeOrg) return
    const confirm = window.confirm(`Are you absolutely sure you want to delete the "${activeOrg.name}" workspace? This action is irreversible and all report assets will be deleted permanently.`)
    
    if (confirm) {
      const updatedList = organizations.filter((o) => o.id !== activeOrg.id)
      setOrganizations(updatedList)
      
      addToast(`Workspace "${activeOrg.name}" has been deleted.`, 'success')
      
      if (updatedList.length > 0) {
        setActiveOrg(updatedList[0])
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Workspace Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage organization details, customize parameters, and govern workspace security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mb-4">Workspace Details</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Workspace Name</label>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  className="input"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Workspace Slug</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-zinc-400 dark:text-zinc-500 select-none">
                    reportly.ai/
                  </span>
                  <input
                    type="text"
                    placeholder="acme-corp"
                    className="input pl-24"
                    {...register('slug')}
                  />
                </div>
                {errors.slug && (
                  <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary h-10 cursor-pointer"
                >
                  {isSubmitting ? 'Saving changes…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="card border-red-200/50 dark:border-red-950/20 bg-red-50/10 dark:bg-red-950/5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-red-650 dark:text-red-450" />
              <h3 className="text-sm font-semibold text-red-650 dark:text-red-400">Danger Zone</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Delete this workspace</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal max-w-md">
                  Once you delete a workspace, there is no going back. All processed CSV cells, uploaded spreadsheets, and AI anomalies reports will be deleted permanently.
                </p>
              </div>
              <button
                onClick={handleDeleteWorkspace}
                className="btn-danger h-10 gap-2 cursor-pointer flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Delete Workspace
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mb-3">Subscription Tier</h3>
            
            <div className="rounded-xl border border-brand-200/30 bg-brand-50/20 dark:bg-brand-950/10 p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-650 dark:text-brand-400 font-mono tracking-wide uppercase">
                  {activeOrg?.plan || 'Free'} Tier
                </span>
                <span className="badge badge-success">Active</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Your workspace is currently operating on the <strong>{activeOrg?.plan || 'Free'}</strong> tier. You have unlimited reports ingestion diagnostics.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">Tier benefits:</p>
              <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Real-time anomaly diagnostics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Advanced SVG monthly trends</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>5 Ingestion analysts seats</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
export default OrgSettingsPage
