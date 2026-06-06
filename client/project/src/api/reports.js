import { api } from './axios'

export function listReports(organizationId, params = {}) {
  return api.get(`/api/organizations/${organizationId}/reports`, { params })
}

export function getReport(organizationId, reportId) {
  return api.get(`/api/organizations/${organizationId}/reports/${reportId}`)
}

export function createReport(organizationId, payload) {
  return api.post(`/api/organizations/${organizationId}/reports`, payload)
}

export function updateReport(organizationId, reportId, payload) {
  return api.patch(`/api/organizations/${organizationId}/reports/${reportId}`, payload)
}

export function deleteReport(organizationId, reportId) {
  return api.delete(`/api/organizations/${organizationId}/reports/${reportId}`)
}

export function getReportSummary(organizationId) {
  return api.get(`/api/organizations/${organizationId}/reports/summary`)
}

export function getReportStatus(organizationId, reportId) {
  return api.get(`/api/organizations/${organizationId}/reports/${reportId}/status`)
}

export function uploadReportFile(organizationId, reportId, formData, config = {}) {
  return api.post(`/api/organizations/${organizationId}/reports/${reportId}/upload`, formData, config)
}

export function exportReportPDF(organizationId, reportId) {
  return api.get(`/api/organizations/${organizationId}/reports/${reportId}/export/pdf`)
}

export function exportReportDOCX(organizationId, reportId) {
  return api.get(`/api/organizations/${organizationId}/reports/${reportId}/export/docx`)
}

export function deleteExport(organizationId, reportId, exportIndex) {
  return api.delete(`/api/organizations/${organizationId}/reports/${reportId}/export/${exportIndex}`)
}
