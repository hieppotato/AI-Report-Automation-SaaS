import { api } from './axios'

export function getCurrentUser() {
  return api.get('/api/auth/me')
}

export function registerUser({ email, password, fullName }) {
  return api.post('/api/auth/register', { email, password, full_name: fullName })
}
