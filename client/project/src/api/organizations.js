import { api } from './axios'

export function listOrganizations() {
  return api.get('/api/organizations')
}

export function createOrganization(payload) {
  return api.post('/api/organizations', payload)
}
