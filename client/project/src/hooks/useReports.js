import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../store/uiStore'
import { useOrgStore } from '../store/orgStore'
import {
  listReports,
  createReport,
  deleteReport,
  getReportSummary,
} from '../api/reports'

// List all reports for the active organization
export function useReports(params = {}) {
  const activeOrg = useOrgStore((state) => state.activeOrg)

  return useQuery({
    queryKey: ['reports', activeOrg?.id, params],
    queryFn: () => listReports(activeOrg.id, params),
    enabled: Boolean(activeOrg?.id),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: (query) => {
      const data = query?.state?.data
      const items = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
      const hasActive = items.some(r => r.status === 'processing' || r.status === 'uploading')
      return hasActive ? 3000 : false
    },
    select: (data) => ({
      items: Array.isArray(data) ? data : (data?.items ?? data?.data ?? []),
      total: data?.total ?? null,
    }),
  })
}

// Create a new report scoped to the active organization
export function useCreateReport() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  const activeOrg = useOrgStore((state) => state.activeOrg)

  return useMutation({
    mutationFn: (reportData) => createReport(activeOrg.id, reportData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports', activeOrg?.id] })
      addToast(`Report "${data.title || data.id}" created successfully!`, 'success')
    },
    onError: (error) => {
      addToast(error?.response?.data?.detail || error.message || 'Failed to create report.', 'error')
    },
  })
}

// Delete a report scoped to the active organization
export function useDeleteReport() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  const activeOrg = useOrgStore((state) => state.activeOrg)

  return useMutation({
    mutationFn: (reportId) => deleteReport(activeOrg.id, reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', activeOrg?.id] })
      addToast('Report deleted successfully.', 'success')
    },
    onError: (error) => {
      addToast(error?.response?.data?.detail || error.message || 'Failed to delete report.', 'error')
    },
  })
}

// Fetch summary metrics for the active organization's reports
export function useReportSummary() {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  return useQuery({
    queryKey: ['report-summary', activeOrg?.id],
    queryFn: () => getReportSummary(activeOrg.id),
    enabled: Boolean(activeOrg?.id),
    staleTime: 1000 * 60, // 1 minute
  })
}
