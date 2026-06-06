import { useMutation, useQuery } from '@tanstack/react-query'
import { getCurrentPlan, createCheckoutSession } from '../api/billing'
import { useOrgStore } from '../store/orgStore'
import { useUIStore } from '../store/uiStore'

export function useBilling() {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { addToast } = useUIStore()
  const orgId = activeOrg?.id

  const planQuery = useQuery({
    queryKey: ['billing-plan', orgId],
    queryFn: () => getCurrentPlan(orgId).then((res) => res.data),
    enabled: Boolean(orgId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const checkoutMutation = useMutation({
    mutationFn: () => createCheckoutSession(orgId).then((res) => res.data),
    onSuccess: (data) => {
      if (data?.checkout_url) {
        addToast('Redirecting to Stripe Secure checkout...', 'success')
        window.location.href = data.checkout_url
      } else {
        addToast('Checkout session generated but no URL returned.', 'error', 3000)
      }
    },
    onError: (err) => {
      addToast(err?.response?.data?.detail || err.message || 'Failed to initialize subscription.', 'error')
    }
  })

  return {
    plan: planQuery.data,
    isLoading: planQuery.isLoading,
    isError: planQuery.isError,
    error: planQuery.error,
    refetch: planQuery.refetch,
    
    upgradeToPro: checkoutMutation.mutateAsync,
    isUpgrading: checkoutMutation.isPending,
  }
}
export default useBilling
