import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  
  setSession: (session) => {
    const user = session?.user || null
    set({
      session,
      user,
      profile: user ? {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatarUrl: user.user_metadata?.avatar_url || null,
      } : null,
      loading: false,
    })
  },
  
  updateProfile: (updates) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null
    }))
  },

  setLoading: (loading) => set({ loading }),
  
  signOut: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('active_org_id')
    set({ user: null, session: null, profile: null, loading: false })
  },
}))
