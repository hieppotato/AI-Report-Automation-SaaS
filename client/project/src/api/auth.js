import { api } from './axios'

export function getCurrentUser() {
  return api.get('/api/auth/me')
}
