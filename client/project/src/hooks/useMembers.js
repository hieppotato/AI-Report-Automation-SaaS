import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addMember, listMembers, removeMember, updateMemberRole } from '../api/members'
import { createInvitation, listInvitations, resendInvitation, cancelInvitation, listMyInvitations, acceptInvitation } from '../api/invitations'
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
    mutationFn: async (payload) => {
      const response = await addMember(activeOrg.id, payload)
      return response
    },
    onSuccess: () => {
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
    mutationFn: async ({ memberId, role }) => {
      const response = await updateMemberRole(activeOrg.id, memberId, role)
      return response
    },
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
    mutationFn: async (userId) => {
      const response = await removeMember(activeOrg.id, userId)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', activeOrg?.id] })
      addToast('Member removed successfully.', 'success')
    },
    onError: (error) => {
      addToast(error?.response?.data?.detail || error.message || 'Failed to remove member.', 'error')
    }
  })
}

export function useInvitations() {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const orgId = activeOrg?.id

  return useQuery({
    queryKey: ['invitations', orgId],
    queryFn: async () => {
      if (!orgId) return []
      const response = await listInvitations(orgId)
      return response.items || []
    },
    enabled: Boolean(orgId),
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const orgId = activeOrg?.id
  const { addToast } = useUIStore()

  return useMutation({
    mutationFn: async ({ email, role }) => {
      if (!orgId) throw new Error('No active organization selected.')
      const response = await createInvitation(orgId, { email, role })
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', orgId] })
      addToast(`Invitation sent to ${data.email}!`, 'success')
    },
    onError: (error) => {
      const message = error?.response?.data?.detail || error?.response?.data?.error?.message || error.message || 'Failed to send invitation.'
      addToast(message, 'error')
    }
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const orgId = activeOrg?.id
  const { addToast } = useUIStore()

  return useMutation({
    mutationFn: async (invitationId) => {
      if (!orgId) throw new Error('No active organization selected.')
      const response = await resendInvitation(orgId, invitationId)
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', orgId] })
      addToast(`Invitation resent to ${data.email}!`, 'success')
    },
    onError: (error) => {
      const message = error?.response?.data?.detail || error?.response?.data?.error?.message || error.message || 'Failed to resend invitation.'
      addToast(message, 'error')
    }
  })
}

export function useMyPendingInvitations() {
  return useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const response = await listMyInvitations()
      return response || []
    },
  })
}

export function useAcceptMyInvitation() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()

  return useMutation({
    mutationFn: async (token) => {
      const response = await acceptInvitation({ token })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      addToast('Invitation accepted! Welcome to the workspace.', 'success')
    },
    onError: (error) => {
      const message = error?.response?.data?.detail || error?.response?.data?.error?.message || error.message || 'Failed to accept invitation.'
      addToast(message, 'error')
    }
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const orgId = activeOrg?.id
  const { addToast } = useUIStore()

  return useMutation({
    mutationFn: async (invitationId) => {
      if (!orgId) throw new Error('No active organization selected.')
      await cancelInvitation(orgId, invitationId)
      return { id: invitationId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', orgId] })
      addToast(`Invitation cancelled.`, 'info')
    },
    onError: (error) => {
      const message = error?.response?.data?.detail || error?.response?.data?.error?.message || error.message || 'Failed to cancel invitation.'
      addToast(message, 'error')
    }
  })
}
