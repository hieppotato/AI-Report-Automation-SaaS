export function normalizeProfile(profile, user) {
  if (!profile && !user) return null

  return {
    id: profile?.id || user?.id,
    email: user?.email || profile?.email || '',
    fullName: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    avatarUrl: profile?.avatar_url || user?.user_metadata?.avatar_url || null,
    companyName: profile?.company_name || '',
    timezone: profile?.timezone || '',
    createdAt: profile?.created_at || null,
    updatedAt: profile?.updated_at || null,
  }
}
