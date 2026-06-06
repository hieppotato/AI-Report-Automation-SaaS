import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteExport } from '../api/reports'
import { useUIStore } from '../store/uiStore'

export function useDeleteExport() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()

  return useMutation({
    mutationFn: ({
      organizationId,
      reportId,
      exportIndex,
    }) =>
      deleteExport(
        organizationId,
        reportId,
        exportIndex
      ),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['report', variables.reportId],
      })

      addToast(
        'Export deleted successfully',
        'success'
      )
    },

    onError: (error) => {
      addToast(
        error?.response?.data?.detail ||
          'Failed to delete export',
        'error'
      )
    },
  })
}