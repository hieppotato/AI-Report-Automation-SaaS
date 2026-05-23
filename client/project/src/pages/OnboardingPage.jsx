import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '../components/layout/AuthLayout'
import { useOrgStore } from '../store/orgStore'
import { useUIStore } from '../store/uiStore'

const schema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'),
})

export function OnboardingPage() {
  const navigate = useNavigate()
  const { organizations, setOrganizations, setActiveOrg } = useOrgStore()
  const { addToast } = useUIStore()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '' }
  })

  const handleNameChange = (e) => {
    const value = e.target.value
    setValue('name', value)
    const generatedSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
    setValue('slug', generatedSlug, { shouldValidate: true })
  }

  const onSubmit = async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    const newOrg = {
      id: `org_${Math.random().toString(36).substring(2, 9)}`,
      name: data.name,
      slug: data.slug,
      plan: 'Free'
    }
    
    const updatedOrgs = [...organizations, newOrg]
    setOrganizations(updatedOrgs)
    setActiveOrg(newOrg)
    
    addToast(`Workspace "${data.name}" created successfully!`, 'success')
    navigate('/dashboard')
  }

  return (
    <AuthLayout title="Create your workspace" subtitle="Set up an organization to start automating reports">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Workspace Name</label>
          <input
            type="text"
            placeholder="e.g. Acme Corp"
            className="input"
            {...register('name')}
            onChange={handleNameChange}
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
          <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
            This is your organization's unique URL identifier.
          </p>
          {errors.slug && (
            <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full h-10 mt-2"
        >
          {isSubmitting ? 'Creating workspace…' : 'Create workspace'}
        </button>
      </form>
    </AuthLayout>
  )
}
export default OnboardingPage
