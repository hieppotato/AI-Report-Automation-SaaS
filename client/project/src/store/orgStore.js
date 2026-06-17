import { create } from 'zustand'

export const useOrgStore = create((set, get) => ({
  organizations: [],
  activeOrg: null,
  loading: false,
  
  setOrganizations: (organizations) => {
    set({ organizations })
    
    const savedOrgId = localStorage.getItem('active_org_id')
    const active = organizations.find((o) => o.id === savedOrgId) || organizations[0] || null
    
    if (active) {
      get().setActiveOrg(active)
    } else {
      set({ activeOrg: null })
      localStorage.removeItem('active_org_id')
    }
  },
  
  setActiveOrg: (org) => {
    set({ activeOrg: org })
    if (org?.id) {
      localStorage.setItem('active_org_id', org.id)
    } else {
      localStorage.removeItem('active_org_id')
    }
  },
  
  setLoading: (loading) => set({ loading }),
  
  clearOrganizations: () => {
    localStorage.removeItem('active_org_id')
    set({ organizations: [], activeOrg: null, loading: false })
  },
}))
