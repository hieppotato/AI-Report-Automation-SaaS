import axios from 'axios'
import { supabase } from './supabase'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach Supabase JWT token and current Org Context
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    
    // Inject active organization context automatically
    try {
      const orgId = localStorage.getItem('active_org_id')
      if (orgId) {
        config.headers['X-Organization-Id'] = orgId
      }
    } catch (e) {
      // Silent catch for localStorage issues
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to format backend error payloads
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.detail || error.message || 'An unexpected error occurred'
    
    console.error(`API Error [${status || 'Network'}]:`, message)
    
    const formattedError = new Error(message)
    formattedError.status = status
    formattedError.originalError = error
    
    return Promise.reject(formattedError)
  }
)
