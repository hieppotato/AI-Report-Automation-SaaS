import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentPlan, createCheckout, getCustomerPortalUrl } from '../api/billing'
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
    queryFn: () => getCurrentPlan(orgId),
    enabled: Boolean(orgId),
    staleTime: 1000 * 60 * 5,
    refetchInterval: isPolling ? 2000 : false,
  })

  useEffect(() => {
    if (isCheckoutSuccess && planQuery.data?.plan === 'free') {
      setIsPolling(true)
    } else {
      setIsPolling(false)
    }
  }, [isCheckoutSuccess, planQuery.data?.plan])

  useEffect(() => {
    if (isCheckoutSuccess && planQuery.data?.plan === 'pro') {
      addToast('Upgrade successful! Welcome to Pro.', 'success')
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      const params = new URLSearchParams(searchParams)
      params.delete('checkout')
      setSearchParams(params, { replace: true })
    }
  }, [isCheckoutSuccess, planQuery.data?.plan, addToast, searchParams, setSearchParams, queryClient])

  const checkoutMutation = useMutation({
    mutationFn: () => createCheckout(orgId),
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

  const portalMutation = useMutation({
    mutationFn: () => getCustomerPortalUrl(orgId),
    onSuccess: (data) => {
      if (data?.portal_url) {
        window.open(data.portal_url, '_blank')
      } else {
        addToast('Could not retrieve customer portal URL.', 'error')
      }
    },
    onError: (err) => {
      addToast(err.message || 'Failed to open customer portal.', 'error')
      planQuery.refetch()
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

    openCustomerPortal: portalMutation.mutateAsync,
    isOpeningPortal: portalMutation.isPending,
  }
}
export default useBilling
