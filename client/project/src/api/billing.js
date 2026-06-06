import { api } from './axios'

export function getCurrentPlan(organizationId) {
  return api.get('/api/billing/current-plan', { params: { organization_id: organizationId } })
}

export function createCheckoutSession(organizationId) {
  return api.post('/api/billing/create-checkout-session', { organization_id: organizationId })
}
