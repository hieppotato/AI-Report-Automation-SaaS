import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createOrganization, listOrganizations } from '../api/organizations'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'

export function useOrganizations() {
  const session = useAuthStore((state) => state.session)
  const setOrganizations = useOrgStore((state) => state.setOrganizations)

  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const organizations = await listOrganizations()
      setOrganizations(organizations)
      return organizations
    },
    enabled: Boolean(session),
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  const setOrganizations = useOrgStore((state) => state.setOrganizations)
  const setActiveOrg = useOrgStore((state) => state.setActiveOrg)

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: async (organization) => {
      const organizations = await queryClient.fetchQuery({
        queryKey: ['organizations'],
        queryFn: listOrganizations,
      })
      setOrganizations(organizations)
      setActiveOrg(organization)
    },
  })
}
