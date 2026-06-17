import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { normalizeProfile } from '../lib/normalizers'

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
      profile: user ? normalizeProfile(null, user) : null,
      loading: false,
    })
  },

  setProfile: (profile) => set((state) => ({
    profile: normalizeProfile(profile, state.user),
  })),
  
  updateProfile: (updates) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null
    }))
  },

  setLoading: (loading) => set({ loading }),

  clearAuth: () => {
    localStorage.removeItem('active_org_id')
    set({ user: null, session: null, profile: null, loading: false })
  },
  
  signOut: async () => {
    await supabase.auth.signOut()
    useAuthStore.getState().clearAuth()
  },
}))
