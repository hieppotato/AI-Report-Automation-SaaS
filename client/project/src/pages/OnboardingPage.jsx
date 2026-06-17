import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '../components/layout/AuthLayout'
import { useCreateOrganization } from '../hooks/useOrganizations'
import { useUIStore } from '../store/uiStore'

const schema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'),
})

export function OnboardingPage() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const createOrganization = useCreateOrganization()

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '' },
  })

  const handleNameChange = (event) => {
    const value = event.target.value
    setValue('name', value)
    setValue(
      'slug',
      value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
      { shouldValidate: true },
    )
  }

  const onSubmit = async (data) => {
    clearErrors('slug')
    try {
      await createOrganization.mutateAsync({ name: data.name, slug: data.slug, plan: 'free' })
      addToast(`Workspace "${data.name}" created successfully.`, 'success')
      navigate('/dashboard')
    } catch (error) {
      if (error.code === 'conflict' || error.status === 409) {
        setError('slug', {
          type: 'server',
          message: error.message || 'This workspace slug is already in use.',
        })
        return
      }

      setError('root', {
        type: 'server',
        message: error.message || 'Could not create workspace. Please try again.',
      })
      addToast(error.message, 'error')
    }
  }

  return (
    <AuthLayout title="Create your workspace" subtitle="Set up an organization to start automating reports">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3.5 py-3 text-sm text-red-700 dark:text-red-400">
            {errors.root.message}
          </div>
        )}

        <div>
          <label className="label">Workspace Name</label>
          <input type="text" placeholder="e.g. Acme Corp" className="input" {...register('name')} onChange={handleNameChange} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Workspace Slug</label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm text-zinc-400 dark:text-zinc-500 select-none">reportly.ai/</span>
            <input type="text" placeholder="acme-corp" className="input pl-24" {...register('slug')} />
          </div>
          {errors.slug ? (
            <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
              This is your organization's unique URL identifier.
            </p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting || createOrganization.isPending} className="btn-primary w-full h-10 mt-2">
          {isSubmitting || createOrganization.isPending ? 'Creating workspace...' : 'Create workspace'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default OnboardingPage
