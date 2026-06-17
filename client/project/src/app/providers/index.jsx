import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useOrgStore } from '../../store/orgStore'
import { getProfile } from '../../api/profile'
import { listOrganizations } from '../../api/organizations'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

export const AppProviders = ({ children }) => {
  const { setSession, setProfile, loading } = useAuthStore()
  const { setOrganizations, clearOrganizations, setLoading: setOrgLoading } = useOrgStore()

  useEffect(() => {
    const hydrateBackendState = async (session) => {
      setSession(session)
      if (!session) {
        clearOrganizations()
        return
      }

      setOrgLoading(true)
      try {
        const [profile, organizations] = await Promise.all([
          getProfile(),
          listOrganizations(),
        ])
        setProfile(profile)
        setOrganizations(organizations)
      } catch (error) {
        console.error('Failed to hydrate backend state:', error)
        setOrganizations([])
      } finally {
        setOrgLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      hydrateBackendState(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateBackendState(session)
    })

    const savedTheme = localStorage.getItem('theme') || 'dark'
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, setProfile, setOrganizations, clearOrganizations, setOrgLoading])

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium text-zinc-400">Verifying session…</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
