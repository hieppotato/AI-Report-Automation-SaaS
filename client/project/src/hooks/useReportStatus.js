import { useQuery } from '@tanstack/react-query'
import { useOrgStore } from '../store/orgStore'
import { getReportStatus } from '../api/reports'

export function useReportStatus(id) {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const orgId = activeOrg?.id

  const statusQuery = useQuery({
    queryKey: ['report-status', orgId, id],
    queryFn: async () => {
      return getReportStatus(orgId, id)
    },
    enabled: !!id && !!orgId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 3000
    },
  })

  return {
    statusData: statusQuery.data,
    status: statusQuery.data?.status,
    progress: statusQuery.data?.progress || 0,
    // Backend ReportStatusResponse uses field name "error"
    errorMessage: statusQuery.data?.error || null,
    isLoading: statusQuery.isLoading,
    isRefetching: statusQuery.isFetching,
    refetch: statusQuery.refetch,
  }
}
