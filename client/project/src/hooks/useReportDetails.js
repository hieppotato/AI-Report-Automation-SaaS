import { useQuery } from '@tanstack/react-query'
import { useOrgStore } from '../store/orgStore'
import { getReport } from '../api/reports'

export function useReportDetails(id) {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const orgId = activeOrg?.id

  const detailsQuery = useQuery({
    queryKey: ['report', orgId, id],
    queryFn: () => getReport(orgId, id),
    enabled: Boolean(orgId && id),
    staleTime: 1000 * 30,
  })

  return {
    report: detailsQuery.data,
    isLoading: detailsQuery.isLoading,
    isError: detailsQuery.isError,
    error: detailsQuery.error,
    refetch: detailsQuery.refetch,
  }
}
