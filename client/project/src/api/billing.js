import { api } from './axios'

export function getCurrentPlan(organizationId) {
  return api.get('/api/billing/current-plan', { params: { organization_id: organizationId } })
}

export function createCheckout(organizationId) {
  return api.post('/api/billing/create-checkout', { organization_id: organizationId })
}

export function getCustomerPortalUrl(organizationId) {
  return api.post('/api/billing/customer-portal', { organization_id: organizationId })
}
