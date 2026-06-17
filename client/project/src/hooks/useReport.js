import { useQuery } from '@tanstack/react-query'
import { getReport } from '../api/reports'
import { useOrgStore } from '../store/orgStore'

export function useReport(reportId) {
  const activeOrg = useOrgStore((state) => state.activeOrg)

  return useQuery({
    queryKey: ['report', activeOrg?.id, reportId],
    queryFn: () => getReport(activeOrg.id, reportId),
    enabled: Boolean(activeOrg?.id && reportId),
  })
}
