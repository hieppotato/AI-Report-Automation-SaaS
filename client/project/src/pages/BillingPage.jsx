import React from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CreditCard, Sparkles, Zap, Loader2, HelpCircle, ExternalLink, Settings } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useBilling } from '../hooks/useBilling'
import { useReports } from '../hooks/useReports'
import { useMembers } from '../hooks/useMembers'
import { useUploads } from '../hooks/useUpload'
import { useOrgStore } from '../store/orgStore'

export function BillingPage() {
  const { t } = useTranslation()
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { plan: apiPlan, isLoading: planLoading, upgradeToPro, isUpgrading, isPolling, openCustomerPortal, isOpeningPortal } = useBilling()
  const { data: reportsResult } = useReports()
  const { data: membersResult } = useMembers()
  const { data: uploadsResult } = useUploads()

  const reportCount = reportsResult?.items?.length || 0
  const memberCount = membersResult?.items?.length || 0

  const uploadsList = uploadsResult?.items || []
  const storageUsedBytes = uploadsList.reduce((acc, item) => acc + (item.size_bytes || 0), 0)
  const storageUsedMB = parseFloat((storageUsedBytes / (1024 * 1024)).toFixed(2))

  const activePlanName = (apiPlan?.plan || activeOrg?.plan || 'free').toLowerCase()
  const isPro = activePlanName === 'pro'

  const reportsLimit = isPro ? 100 : 3
  const reportsRemaining = Math.max(0, reportsLimit - reportCount)

  const storageLimitMB = isPro ? 100 : 10
  const storageRemainingMB = parseFloat(Math.max(0, storageLimitMB - storageUsedMB).toFixed(2))

  const seatsLimit = isPro ? 5 : 1
  const seatsRemaining = Math.max(0, seatsLimit - memberCount)

  const handleUpgrade = async (planName) => {
    if (planName === 'pro') {
      try {
        await upgradeToPro()
      } catch (err) {
        // handled in hook
      }
    }
  }

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal()
    } catch (err) {
      // handled in hook
    }
  }

  const getStatusBadge = (planName, status, polling) => {
    if (polling) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 animate-pulse animate-infinite">
          <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
          {t('billing.verifying')}
        </span>
      )
    }

    if (planName === 'pro') {
      if (status === 'paused') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {t('billing.activeProPaused')}
          </span>
        )
      }
      if (status === 'on_trial') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {t('billing.activeProTrial')}
          </span>
        )
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
          {t('billing.activePro')}
        </span>
      )
    }

    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {t('billing.cancelled')}
        </span>
      )
    }

    if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/25">
          {t('billing.expired')}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-550 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
        {t('billing.freePlan')}
      </span>
    )
  }

  const plans = [
    {
      name: t('billing.free'),
      price: t('billing.freePrice'),
      description: t('billing.freeDescription'),
      features: [
        t('billing.freeFeature1'),
        t('billing.freeFeature2'),
        t('billing.freeFeature3'),
        t('billing.freeFeature4'),
      ],
      cta: t('billing.yourCurrentPlan'),
      current: !isPro,
    },
    {
      name: t('billing.pro'),
      price: t('billing.proPrice'),
      description: t('billing.proDescription'),
      features: [
        t('billing.proFeature1'),
        t('billing.proFeature2'),
        t('billing.proFeature3'),
        t('billing.proFeature4'),
        t('billing.proFeature5'),
      ],
      cta: t('billing.upgradeToPro'),
      current: isPro,
    },
  ]

  const comparisons = [
    { feature: t('billing.comparisonIngestLimit'), free: t('billing.comparisonFreeIngestLimit'), pro: t('billing.comparisonProIngestLimit') },
    { feature: t('billing.comparisonFileFormats'), free: t('billing.comparisonFreeFormats'), pro: t('billing.comparisonProFormats') },
    { feature: t('billing.comparisonAIDiagnostics'), free: t('billing.no'), pro: t('billing.comparisonProDiagnostics') },
    { feature: t('billing.comparisonSeatAllowance'), free: t('billing.comparisonFreeSeats'), pro: t('billing.comparisonProSeats') },
    { feature: t('billing.comparisonSupportTier'), free: t('billing.comparisonFreeSupport'), pro: t('billing.comparisonProSupport') },
    { feature: t('billing.comparisonLemonSqueezy'), free: t('billing.no'), pro: t('billing.yes') },
  ]

  if (planLoading) {
    return (
      <DashboardLayout>
        <div className="mb-8 space-y-3">
          <div className="h-7 w-48 bg-zinc-200 dark:bg-zinc-850 rounded animate-pulse" />
          <div className="h-4 w-96 bg-zinc-150 dark:bg-zinc-900 rounded animate-pulse" />
        </div>
        <div className="h-44 bg-zinc-200 dark:bg-zinc-850 rounded-xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="h-32 bg-zinc-200 dark:bg-zinc-850 rounded-xl animate-pulse" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-850 rounded-xl animate-pulse" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-850 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-zinc-200 dark:bg-zinc-850 rounded-xl animate-pulse" />
          <div className="h-96 bg-zinc-200 dark:bg-zinc-850 rounded-xl animate-pulse" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">{t('billing.title')}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t('billing.subtitle')}</p>
      </div>

      {isPolling && (
        <div className="mb-6 p-4 rounded-xl border border-brand-500/25 bg-brand-500/5 text-brand-700 dark:text-brand-400 flex items-start gap-3 text-xs leading-normal animate-in fade-in slide-in-from-top-2 duration-255">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-brand-650 dark:text-brand-500 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">{t('billing.processingUpgrade')}</span>
            <p className="mt-1 text-zinc-500 dark:text-zinc-405 leading-relaxed">
              {t('billing.processingDescription')}
            </p>
          </div>
        </div>
      )}

      {!apiPlan || activePlanName === 'free' ? (
        <div className="card border border-dashed border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 mb-8 text-center flex flex-col items-center justify-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-zinc-400 dark:text-zinc-500 mb-3.5">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{t('billing.freePlanMessage')}</h3>
          <p className="mt-2 text-xs text-zinc-555 dark:text-zinc-400 max-w-md leading-relaxed">
            {t('billing.freePlanDescription')}
          </p>
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={isUpgrading}
            className="btn-primary h-9 gap-1.5 mt-5 cursor-pointer text-xs justify-center"
          >
                {isUpgrading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t('billing.generatingCheckout')}
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {t('billing.upgradeToPro')}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="card border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                {t('billing.currentWorkspacePlan')}
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 capitalize">
                  {activePlanName} Plan
                </h2>
                {getStatusBadge(activePlanName, apiPlan.status, isPolling)}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl">
                {t('billing.thankYouMessage')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-left sm:text-right">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                    {t('billing.provider')}
                  </span>
                  <span className="text-xs font-semibold text-zinc-750 dark:text-zinc-350 capitalize mt-1 block">
                    {apiPlan.provider || 'LemonSqueezy'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                    {apiPlan.status === 'cancelled' ? t('billing.accessEndsAt') : t('billing.renewalDate')}
                  </span>
                  <span className="text-xs font-semibold text-zinc-750 dark:text-zinc-350 mt-1 block">
                    {apiPlan.renewal_at
                      ? new Date(apiPlan.renewal_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleManageSubscription}
                disabled={isOpeningPortal}
                className="btn-secondary h-9 gap-1.5 cursor-pointer text-xs justify-center whitespace-nowrap"
              >
                {isOpeningPortal ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t('billing.loading')}
                  </>
                ) : (
                  <>
                    <Settings className="w-3.5 h-3.5" />
                    {t('billing.manageSubscription')}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-zinc-400 animate-pulse" />
              {t('billing.reportsIngestion')}
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-450">
              {t('billing.reportsCount', { count: reportCount, limit: reportsLimit })}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mt-3">
            <div 
              className="h-full rounded-full bg-brand-600 transition-all duration-500" 
              style={{ width: `${Math.min(100, (reportCount / reportsLimit) * 100)}%` }} 
            />
          </div>
          <div className="flex justify-between items-center mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>{t('billing.reportsRemaining', { count: reportsRemaining })}</span>
            <span>{t('billing.reportsLimit', { limit: reportsLimit })}</span>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-zinc-400" />
              {t('billing.storageSpace')}
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-450">
              {t('billing.storageCount', { used: storageUsedMB, limit: storageLimitMB })}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mt-3">
            <div 
              className="h-full rounded-full bg-brand-600 transition-all duration-500" 
              style={{ width: `${Math.min(100, (storageUsedMB / storageLimitMB) * 100)}%` }} 
            />
          </div>
          <div className="flex justify-between items-center mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>{t('billing.storageRemaining', { amount: storageRemainingMB })}</span>
            <span>{t('billing.storageLimit', { limit: storageLimitMB })}</span>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-zinc-400" />
              {t('billing.workspaceSeats')}
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-450">
              {t('billing.seatsCount', { count: memberCount, limit: seatsLimit })}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mt-3">
            <div 
              className="h-full rounded-full bg-brand-650 transition-all duration-500" 
              style={{ width: `${Math.min(100, (memberCount / seatsLimit) * 100)}%` }} 
            />
          </div>
          <div className="flex justify-between items-center mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>{t('billing.seatsRemaining', { count: seatsRemaining })}</span>
            <span>{t('billing.seatsLimit', { limit: seatsLimit })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`card relative overflow-hidden flex flex-col justify-between ${
              plan.current
                ? 'border-brand-500 dark:border-brand-600 shadow-md ring-1 ring-brand-500 bg-brand-50/5 dark:bg-brand-950/5'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {plan.name === 'Pro' && (
              <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 border border-brand-200/40 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                {t('billing.popularChoice')}
              </span>
            )}

            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 leading-normal">{plan.description}</p>
              
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{plan.price}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{t('billing.perMonth')}</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-900">
              {plan.current && isPro ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={isOpeningPortal}
                  className="btn-secondary w-full h-10 cursor-pointer text-xs justify-center gap-2"
                >
                  {isOpeningPortal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('billing.loading')}
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4" />
                      {t('billing.manageSubscription')}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.name.toLowerCase())}
                  disabled={plan.current || isUpgrading}
                  className={
                    plan.current
                      ? 'btn-secondary w-full h-10 select-none bg-zinc-50 dark:bg-zinc-900/60 font-semibold cursor-not-allowed text-xs'
                      : 'btn-primary w-full h-10 cursor-pointer text-xs justify-center gap-2'
                  }
                >
                  {isUpgrading && plan.name === 'Pro' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                      {t('billing.creatingCheckout')}
                    </>
                  ) : plan.current ? (
                    t('billing.activePlan')
                  ) : (
                    plan.cta
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
          <h3 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            {t('billing.pricingComparison')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-50/20 dark:bg-zinc-900/5">
                <th className="py-3 px-6">{t('billing.featureDetails')}</th>
                <th className="py-3 px-6">{t('billing.freePlan')}</th>
                <th className="py-3 px-6">{t('billing.proPlan')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 leading-relaxed text-zinc-650 dark:text-zinc-350">
              {comparisons.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/5 transition-colors">
                  <td className="py-3.5 px-6 font-medium text-zinc-800 dark:text-zinc-200">{row.feature}</td>
                  <td className="py-3.5 px-6">{row.free}</td>
                  <td className="py-3.5 px-6 font-semibold text-brand-600 dark:text-brand-400">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default BillingPage
