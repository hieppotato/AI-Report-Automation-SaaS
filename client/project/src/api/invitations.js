import { api } from './axios'

export function createInvitation(organizationId, payload) {
  return api.post(`/api/organizations/${organizationId}/invitations`, payload)
}

export function listInvitations(organizationId, params = {}) {
  return api.get(`/api/organizations/${organizationId}/invitations`, { params })
}

export function resendInvitation(organizationId, invitationId) {
  return api.post(`/api/organizations/${organizationId}/invitations/${invitationId}/resend`)
}

export function cancelInvitation(organizationId, invitationId) {
  return api.delete(`/api/organizations/${organizationId}/invitations/${invitationId}`)
}

export function acceptInvitation(payload) {
  return api.post('/api/invitations/accept', payload)
}

export function listMyInvitations() {
  return api.get('/api/invitations/mine')
}

