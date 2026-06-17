import { api } from './axios'

export function listMembers(organizationId, params = {}) {
  return api.get(`/api/organizations/${organizationId}/members`, { params })
}

export function addMember(organizationId, payload) {
  return api.post(`/api/organizations/${organizationId}/members`, payload)
}

export function updateMemberRole(organizationId, memberId, role) {
  return api.patch(`/api/organizations/${organizationId}/members/${memberId}`, { role })
}

export function removeMember(organizationId, userId) {
  return api.delete(`/api/organizations/${organizationId}/members/${userId}`)
}
