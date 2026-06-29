import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { registerUser } from '../api/auth'

export function useAuth() {
  const auth = useAuthStore()

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    auth.setSession(data.session)
    return data
  }

  const register = async ({ email, password, fullName }) => {
    try {
      await registerUser({ email, password, fullName })
    } catch (e) {
      if (e.status === 502) {
        throw new Error('Registration service is temporarily unavailable. Please try again later.')
      }
      throw e
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.session) {
      auth.setSession(data.session)
    }
    return data
  }

  return {
    ...auth,
    login,
    register,
    logout: auth.signOut,
  }
}
