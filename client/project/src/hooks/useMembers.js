import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addMember, listMembers, removeMember, updateMemberRole } from '../api/members'
import { useOrgStore } from '../store/orgStore'
import { useUIStore } from '../store/uiStore'

export function useMembers(params = {}) {
  const activeOrg = useOrgStore((state) => state.activeOrg)

  return useQuery({
    queryKey: ['members', activeOrg?.id, params],
    queryFn: () => listMembers(activeOrg.id, params),
    enabled: Boolean(activeOrg?.id),
  })
}

export function useAddMember() {
  const queryClient = useQueryClient()
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { addToast } = useUIStore()

  return useMutation({
    mutationFn: (payload) => addMember(activeOrg.id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members', activeOrg?.id] })
      addToast('Team member added successfully!', 'success')
    },
    onError: (error) => {
      addToast(error?.response?.data?.detail || error.message || 'Failed to add member.', 'error')
    }
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { addToast } = useUIStore()

  return useMutation({
    mutationFn: ({ memberId, role }) => updateMemberRole(activeOrg.id, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', activeOrg?.id] })
      addToast('Member role updated successfully.', 'success')
    },
    onError: (error) => {
      addToast(error?.response?.data?.detail || error.message || 'Failed to update member role.', 'error')
    }
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { addToast } = useUIStore()

  return useMutation({
    mutationFn: (userId) => removeMember(activeOrg.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', activeOrg?.id] })
      addToast('Member removed successfully.', 'success')
    },
    onError: (error) => {
      addToast(error?.response?.data?.detail || error.message || 'Failed to remove member.', 'error')
    }
  })
}
