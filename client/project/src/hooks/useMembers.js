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
  const orgId = activeOrg?.id

  return useMutation({
    mutationFn: async (payload) => {
      const response = await addMember(activeOrg.id, payload)
      // Log to local audit logs
      if (orgId) {
        const auditKey = `audit_logs_${orgId}`
        const logs = JSON.parse(localStorage.getItem(auditKey) || '[]')
        logs.unshift({
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
          user: 'You',
          action: 'added_member',
          target: payload.email || payload.user_id || 'new_user',
        })
        localStorage.setItem(auditKey, JSON.stringify(logs))
      }
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
  const orgId = activeOrg?.id

  return useMutation({
    mutationFn: async ({ memberId, role }) => {
      const response = await updateMemberRole(activeOrg.id, memberId, role)
      // Log to local audit logs
      if (orgId) {
        const auditKey = `audit_logs_${orgId}`
        const logs = JSON.parse(localStorage.getItem(auditKey) || '[]')
        logs.unshift({
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
          user: 'You',
          action: 'changed_role',
          target: memberId,
        })
        localStorage.setItem(auditKey, JSON.stringify(logs))
      }
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
  const orgId = activeOrg?.id

  return useMutation({
    mutationFn: async (userId) => {
      const response = await removeMember(activeOrg.id, userId)
      // Log to local audit logs
      if (orgId) {
        const auditKey = `audit_logs_${orgId}`
        const logs = JSON.parse(localStorage.getItem(auditKey) || '[]')
        logs.unshift({
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
          user: 'You',
          action: 'removed_member',
          target: userId,
        })
        localStorage.setItem(auditKey, JSON.stringify(logs))
      }
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

// Simulated Invitation Hooks
export function useInvitations() {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const orgId = activeOrg?.id

  return useQuery({
    queryKey: ['invitations', orgId],
    queryFn: () => {
      if (!orgId) return []
      const data = localStorage.getItem(`invitations_${orgId}`)
      return data ? JSON.parse(data) : []
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
      const key = `invitations_${orgId}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      
      if (existing.some((inv) => inv.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('An invitation has already been sent to this email.')
      }

      const newInv = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        email,
        role,
        status: 'pending',
        created_at: new Date().toISOString(),
      }

      existing.push(newInv)
      localStorage.setItem(key, JSON.stringify(existing))

      // Also append to audit logs
      const auditKey = `audit_logs_${orgId}`
      const logs = JSON.parse(localStorage.getItem(auditKey) || '[]')
      logs.unshift({
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        user: 'You',
        action: 'invited_member',
        target: email,
      })
      localStorage.setItem(auditKey, JSON.stringify(logs))

      return newInv
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', orgId] })
      addToast(`Invitation sent to ${data.email}!`, 'success')
    },
    onError: (error) => {
      addToast(error.message || 'Failed to send invitation.', 'error')
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
      const key = `invitations_${orgId}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const index = existing.findIndex((inv) => inv.id === invitationId)
      if (index === -1) throw new Error('Invitation not found.')

      existing[index].created_at = new Date().toISOString()
      localStorage.setItem(key, JSON.stringify(existing))

      // Also append to audit logs
      const auditKey = `audit_logs_${orgId}`
      const logs = JSON.parse(localStorage.getItem(auditKey) || '[]')
      logs.unshift({
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        user: 'You',
        action: 'resent_invitation',
        target: existing[index].email,
      })
      localStorage.setItem(auditKey, JSON.stringify(logs))

      return existing[index]
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', orgId] })
      addToast(`Invitation resent to ${data.email}!`, 'success')
    },
    onError: (error) => {
      addToast(error.message || 'Failed to resend invitation.', 'error')
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
      const key = `invitations_${orgId}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const target = existing.find((inv) => inv.id === invitationId)
      if (!target) throw new Error('Invitation not found.')

      const updated = existing.filter((inv) => inv.id !== invitationId)
      localStorage.setItem(key, JSON.stringify(updated))

      // Also append to audit logs
      const auditKey = `audit_logs_${orgId}`
      const logs = JSON.parse(localStorage.getItem(auditKey) || '[]')
      logs.unshift({
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        user: 'You',
        action: 'cancelled_invitation',
        target: target.email,
      })
      localStorage.setItem(auditKey, JSON.stringify(logs))

      return target
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', orgId] })
      addToast(`Invitation for ${data.email} cancelled.`, 'info')
    },
    onError: (error) => {
      addToast(error.message || 'Failed to cancel invitation.', 'error')
    }
  })
}
