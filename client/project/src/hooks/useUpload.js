import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUpload, listUploads } from '../api/uploads'
import { supabase } from '../lib/supabase'
import { useOrgStore } from '../store/orgStore'

export function useUploads(params = {}) {
  const activeOrg = useOrgStore((state) => state.activeOrg)

  return useQuery({
    queryKey: ['uploads', activeOrg?.id, params],
    queryFn: () => listUploads(activeOrg.id, params),
    enabled: Boolean(activeOrg?.id),
  })
}

export function useCreateUploadMetadata() {
  const queryClient = useQueryClient()
  const activeOrg = useOrgStore((state) => state.activeOrg)

  return useMutation({
    mutationFn: (payload) => createUpload(activeOrg.id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['uploads', activeOrg?.id] }),
  })
}

export async function uploadFileToStorage({ organizationId, file, onProgress }) {
  const bucket = import.meta.env.VITE_SUPABASE_UPLOAD_BUCKET || 'uploads'
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${organizationId}/${Date.now()}-${safeName}`

  onProgress?.(15)
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw error
  }

  onProgress?.(80)
  return { bucket, filePath }
}
