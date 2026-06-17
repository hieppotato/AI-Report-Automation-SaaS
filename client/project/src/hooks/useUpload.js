import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listUploads, uploadFile } from '../api/uploads'
import { useOrgStore } from '../store/orgStore'

export function useUploads(params = {}) {
  const activeOrg = useOrgStore((state) => state.activeOrg)

  return useQuery({
    queryKey: ['uploads', activeOrg?.id, params],
    queryFn: () => listUploads(activeOrg.id, params),
    enabled: Boolean(activeOrg?.id),
  })
}

export function useUploadFile() {
  const queryClient = useQueryClient()
  const activeOrg = useOrgStore((state) => state.activeOrg)

  return useMutation({
    mutationFn: async ({ file, onProgress }) => {
      if (!activeOrg?.id) {
        throw new Error('Select a workspace before uploading.')
      }

      const formData = new FormData()
      formData.append('file', file)

      return uploadFile(activeOrg.id, formData, {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(percentCompleted)
          }
        },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['uploads', activeOrg?.id] }),
  })
}
