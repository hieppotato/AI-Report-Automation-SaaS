import { useMutation, useQueryClient } from '@tanstack/react-query'
import { exportReportPDF, exportReportDOCX } from '../api/reports'
import { useOrgStore } from '../store/orgStore'
import { useUIStore } from '../store/uiStore'

/**
 * Downloads a file from a signed URL using fetch + Blob approach.
 * This avoids opening a new tab and works across Chrome, Edge, Firefox.
 * The temporary blob URL is revoked after download to free memory.
 */
async function downloadFromSignedUrl(signedUrl, filename) {
  const response = await fetch(signedUrl)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`)
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()

  // Clean up: revoke blob URL and remove anchor
  // Small delay ensures download is initiated before cleanup
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
    anchor.remove()
  }, 150)
}

export function useExportReport() {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reportId, format }) => {
      if (!activeOrg?.id) throw new Error('No active organization')

      addToast('Generating report...', 'info')

      if (format === 'pdf') {
        const res = await exportReportPDF(activeOrg.id, reportId)
        console.log("RAW EXPORT RESPONSE", res)
        return { ...res, format }
      } else {
        const res = await exportReportDOCX(activeOrg.id, reportId)
        console.log("RAW EXPORT RESPONSE", res)
        return { ...res, format }
      }
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report', activeOrg?.id, variables.reportId] })

      if (data?.signed_url) {
        try {
          const filename = data.filename
            || (data.file_path ? data.file_path.split('/').pop() : null)
            || `report_${variables.reportId}.${data.format}`
          console.log("FINAL DATA", data)
          await downloadFromSignedUrl(data.signed_url, filename)
          addToast('Download started', 'success')
        } catch (downloadErr) {
          console.error('Blob download failed, falling back to direct link:', downloadErr)
          // Fallback: direct anchor click (no new tab)
          const fallbackAnchor = document.createElement('a')
          fallbackAnchor.href = data.signed_url
          fallbackAnchor.download = data.filename || `report.${data.format}`
          fallbackAnchor.style.display = 'none'
          document.body.appendChild(fallbackAnchor)
          fallbackAnchor.click()
          fallbackAnchor.remove()
          addToast('Download started', 'success')
        }
      } else {
        addToast('Export completed, but no download URL was returned.', 'warning')
      }
    },
    onError: (err) => {
      addToast(err?.response?.data?.detail || err.message || 'Export failed.', 'error')
    }
  })
}

export default useExportReport
