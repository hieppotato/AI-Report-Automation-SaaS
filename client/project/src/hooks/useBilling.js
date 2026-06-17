import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentPlan, createCheckout } from '../api/billing'
import { useOrgStore } from '../store/orgStore'
import { useUIStore } from '../store/uiStore'
import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

export function useBilling() {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { addToast } = useUIStore()
  const orgId = activeOrg?.id
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const isCheckoutSuccess = searchParams.get('checkout') === 'success'

  const [isPolling, setIsPolling] = useState(false)

  const planQuery = useQuery({
    queryKey: ['billing-plan', orgId],
    queryFn: () => getCurrentPlan(orgId).then((res) => res.data),
    enabled: Boolean(orgId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: isPolling ? 2000 : false,
  })

  // Start polling when checkout=success is in URL and the plan is still 'free'
  useEffect(() => {
    if (isCheckoutSuccess && planQuery.data?.plan === 'free') {
      setIsPolling(true)
    } else {
      setIsPolling(false)
    }
  }, [isCheckoutSuccess, planQuery.data?.plan])

  // Clear query params and show success toast once plan switches to 'pro'
  useEffect(() => {
    if (isCheckoutSuccess && planQuery.data?.plan === 'pro') {
      addToast('Upgrade successful! Welcome to Pro.', 'success')
      // Refresh organizations query to update local state (activeOrg, etc.)
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      // Remove checkout query param
      const params = new URLSearchParams(searchParams)
      params.delete('checkout')
      setSearchParams(params, { replace: true })
    }
  }, [isCheckoutSuccess, planQuery.data?.plan, addToast, searchParams, setSearchParams, queryClient])

  const checkoutMutation = useMutation({
    mutationFn: () => createCheckout(orgId).then((res) => res.data),
    onSuccess: (data) => {
      if (data?.checkout_url) {
        addToast('Redirecting to LemonSqueezy secure checkout...', 'success')
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
    isPolling,
    
    upgradeToPro: checkoutMutation.mutateAsync,
    isUpgrading: checkoutMutation.isPending,
  }
}
export default useBilling
