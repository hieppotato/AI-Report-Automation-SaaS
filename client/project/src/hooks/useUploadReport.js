import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../store/uiStore'
import { useOrgStore } from '../store/orgStore'
import { uploadReportFile } from '../api/reports'

export function useUploadReport() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  const activeOrg = useOrgStore((state) => state.activeOrg)

  const uploadMutation = useMutation({
    mutationFn: async ({ id, file, onProgress }) => {
      if (!activeOrg?.id) throw new Error('No active organization')

      const formData = new FormData()
      formData.append('file', file)

      const response = await uploadReportFile(
        activeOrg.id,
        id,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              onProgress(percentCompleted)
            }
          },
        }
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', activeOrg?.id] })
      queryClient.invalidateQueries({ queryKey: ['report', activeOrg?.id, variables.id] })
      queryClient.invalidateQueries({ queryKey: ['report-status', activeOrg?.id, variables.id] })
      addToast('File uploaded successfully! Starting AI analysis.', 'success')
    },
    onError: (error) => {
      addToast(error.message || 'File upload failed.', 'error')
    },
  })

  return {
    uploadFile: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isError: uploadMutation.isError,
    error: uploadMutation.error,
  }
}
