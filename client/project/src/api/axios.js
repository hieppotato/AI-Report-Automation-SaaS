import axios from 'axios'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const status = error.response?.status
    const payload = error.response?.data
    const backendError = payload?.error
    const message = backendError?.message || payload?.detail || error.message || 'Request failed'
    const normalized = new Error(message)

    normalized.status = status
    normalized.code = backendError?.code || (status === 401 ? 'unauthorized' : 'api_error')
    normalized.details = backendError?.details || null
    normalized.originalError = error

    if (status === 401) {
      useAuthStore.getState().clearAuth()
    }

    return Promise.reject(normalized)
  }
)

export default api
