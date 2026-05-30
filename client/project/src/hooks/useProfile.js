import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile } from '../api/profile'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'

export function useProfile() {
  const setProfile = useAuthStore((state) => state.setProfile)

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const profile = await getProfile()
      setProfile(profile)
      return profile
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setProfile = useAuthStore((state) => state.setProfile)
  const { addToast } = useUIStore()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      setProfile(profile)
      queryClient.setQueryData(['profile'], profile)
      addToast('Profile updated successfully.', 'success')
    },
    onError: (error) => {
      addToast(error?.response?.data?.detail || error.message || 'Failed to update profile.', 'error')
    }
  })
}
