import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useOrgStore } from '../../store/orgStore'

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
  const { setSession, loading } = useAuthStore()
  const { setOrganizations } = useOrgStore()

  useEffect(() => {
    // Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        // Load default workspaces to populate organization context.
        const defaultWorkspaces = [
          { id: 'org_1', name: 'Acme Corp', slug: 'acme-corp', plan: 'Pro' },
          { id: 'org_2', name: 'Stark Enterprises', slug: 'stark-enterprises', plan: 'Enterprise' }
        ]
        setOrganizations(defaultWorkspaces)
      }
    })

    // Listen to changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        const defaultWorkspaces = [
          { id: 'org_1', name: 'Acme Corp', slug: 'acme-corp', plan: 'Pro' },
          { id: 'org_2', name: 'Stark Enterprises', slug: 'stark-enterprises', plan: 'Enterprise' }
        ]
        setOrganizations(defaultWorkspaces)
      } else {
        setOrganizations([])
      }
    })

    // Setup initial system theme
    const savedTheme = localStorage.getItem('theme') || 'dark'
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, setOrganizations])

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
