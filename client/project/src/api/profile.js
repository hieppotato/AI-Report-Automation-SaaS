import { api } from './axios'

export function getProfile() {
  return api.get('/api/profile/me')
}

export function updateProfile(payload) {
  return api.patch('/api/profile/me', {
    full_name: payload.fullName,
    avatar_url: payload.avatarUrl,
    company_name: payload.companyName,
    timezone: payload.timezone,
  })
}
