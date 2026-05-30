import { api } from './axios'

export function listUploads(organizationId, params = {}) {
  return api.get(`/api/organizations/${organizationId}/uploads`, { params })
}

export function createUpload(organizationId, payload) {
  return api.post(`/api/organizations/${organizationId}/uploads`, payload)
}

export function getUpload(organizationId, uploadId) {
  return api.get(`/api/organizations/${organizationId}/uploads/${uploadId}`)
}
