import React from 'react'
import { Check, CreditCard, Sparkles, Zap, Loader2, HelpCircle } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useBilling } from '../hooks/useBilling'
import { useReports } from '../hooks/useReports'
import { useMembers } from '../hooks/useMembers'
import { useUploads } from '../hooks/useUpload'
import { useOrgStore } from '../store/orgStore'

export function BillingPage() {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { plan: apiPlan, isLoading: planLoading, upgradeToPro, isUpgrading, isPolling } = useBilling()
  const { data: reportsResult } = useReports()
  const { data: membersResult } = useMembers()
  const { data: uploadsResult } = useUploads()

  const reportCount = reportsResult?.items?.length || 0
  const memberCount = membersResult?.items?.length || 0

  // Calculate storage usage
  const uploadsList = uploadsResult?.items || []
  const storageUsedBytes = uploadsList.reduce((acc, item) => acc + (item.size_bytes || 0), 0)
  const storageUsedMB = parseFloat((storageUsedBytes / (1024 * 1024)).toFixed(2))

  // Standardize plan active state from API or store fallback
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

  const getStatusBadge = (planName, status, polling) => {
    if (polling) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 animate-pulse animate-infinite">
          <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
          Verifying...
        </span>
      )
    }

    if (planName === 'pro') {
      if (status === 'paused') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Active Pro (Paused)
          </span>
        )
      }
      if (status === 'on_trial') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Active Pro (Trial)
          </span>
        )
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
          Active Pro
        </span>
      )
    }

    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Cancelled
        </span>
      )
    }

    if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/25">
          Expired
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-550 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
        Free Plan
      </span>
    )
  }

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Ideal for basic solo analyst workflows.',
      features: [
        '3 Processed reports limit',
        'Basic CSV upload ingestion',
        'Standard SVG trend sparklines',
        '1 Member seat maximum',
      ],
      cta: 'Your Current Plan',
      current: !isPro,
    },
    {
      name: 'Pro',
      price: '$49',
      description: 'Best for standard growing SaaS systems.',
      features: [
        '100 Processed reports per month',
        'Advanced CSV & Excel support',
        'AI anomaly diagnostics engine',
        '5 Member seats included',
        'LemonSqueezy billing integration',
      ],
      cta: 'Upgrade to Pro',
      current: isPro,
    },
  ]

  const comparisons = [
    { feature: 'Monthly Ingest Limit', free: '3 reports', pro: '100 reports' },
    { feature: 'File Formats', free: 'CSV only', pro: 'CSV, XLSX, XLS, PDF' },
    { feature: 'AI Diagnostics', free: 'No', pro: 'Yes, full suite' },
    { feature: 'Seat Allowance', free: '1 member', pro: '5 members' },
    { feature: 'Support Tier', free: 'Community', pro: 'Priority Email' },
    { feature: 'LemonSqueezy Billing', free: 'No', pro: 'Yes' },
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
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Billing & Subscriptions</h1>
        <p className="text-sm text-zinc-500 mt-1">Govern subscription metrics, track usage quotas, and manage plan tiers.</p>
      </div>

      {/* Checkout Polling Banner */}
      {isPolling && (
        <div className="mb-6 p-4 rounded-xl border border-brand-500/25 bg-brand-500/5 text-brand-700 dark:text-brand-400 flex items-start gap-3 text-xs leading-normal animate-in fade-in slide-in-from-top-2 duration-255">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-brand-650 dark:text-brand-500 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">Processing LemonSqueezy subscription upgrade...</span>
            <p className="mt-1 text-zinc-500 dark:text-zinc-405 leading-relaxed">
              We are currently waiting for the LemonSqueezy payment webhook to propagate. Once confirmed, your plan and workspace limits will automatically update.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan & Details */}
      {!apiPlan || activePlanName === 'free' ? (
        <div className="card border border-dashed border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 mb-8 text-center flex flex-col items-center justify-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-zinc-400 dark:text-zinc-500 mb-3.5">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">You're currently on the Free plan.</h3>
          <p className="mt-2 text-xs text-zinc-555 dark:text-zinc-400 max-w-md leading-relaxed">
            Upgrade to the Pro plan to expand your processed reports limit, upload advanced Excel/PDF files, invite team members, and get access to our AI diagnostics engine.
          </p>
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={isUpgrading}
            className="btn-primary h-9 gap-1.5 mt-5 cursor-pointer text-xs justify-center"
          >
            {isUpgrading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating Checkout...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade to Pro
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="card border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                Current Workspace Plan
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 capitalize">
                  {activePlanName} Plan
                </h2>
                {getStatusBadge(activePlanName, apiPlan.status, isPolling)}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl">
                Thank you for subscribing! You have full access to pro reports, custom data formats, anomalies diagnostics, and custom exports.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 text-left sm:text-right border-t sm:border-t-0 border-zinc-100 dark:border-zinc-905 pt-4 sm:pt-0">
              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                  Provider
                </span>
                <span className="text-xs font-semibold text-zinc-750 dark:text-zinc-350 capitalize mt-1 block">
                  {apiPlan.provider || 'LemonSqueezy'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                  {apiPlan.status === 'cancelled' ? 'Access Ends At' : 'Renewal Date'}
                </span>
                <span className="text-xs font-semibold text-zinc-750 dark:text-zinc-350 mt-1 block">
                  {apiPlan.renewal_at
                    ? new Date(apiPlan.renewal_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Quotas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Reports Ingestion Quota */}
        <div className="card">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-zinc-400 animate-pulse" />
              Reports Ingestion
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-450">
              {reportCount} / {reportsLimit} reports
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mt-3">
            <div 
              className="h-full rounded-full bg-brand-600 transition-all duration-500" 
              style={{ width: `${Math.min(100, (reportCount / reportsLimit) * 100)}%` }} 
            />
          </div>
          <div className="flex justify-between items-center mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>{reportsRemaining} reports remaining</span>
            <span>Limit: {reportsLimit}/mo</span>
          </div>
        </div>

        {/* Storage Space Quota */}
        <div className="card">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-zinc-400" />
              Storage Space
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-450">
              {storageUsedMB} MB / {storageLimitMB} MB
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mt-3">
            <div 
              className="h-full rounded-full bg-brand-600 transition-all duration-500" 
              style={{ width: `${Math.min(100, (storageUsedMB / storageLimitMB) * 100)}%` }} 
            />
          </div>
          <div className="flex justify-between items-center mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>{storageRemainingMB} MB remaining</span>
            <span>Limit: {storageLimitMB} MB</span>
          </div>
        </div>

        {/* Workspace Seat Quota */}
        <div className="card">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-zinc-400" />
              Workspace Seats
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-450">
              {memberCount} / {seatsLimit} seats
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mt-3">
            <div 
              className="h-full rounded-full bg-brand-650 transition-all duration-500" 
              style={{ width: `${Math.min(100, (memberCount / seatsLimit) * 100)}%` }} 
            />
          </div>
          <div className="flex justify-between items-center mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>{seatsRemaining} seats remaining</span>
            <span>Limit: {seatsLimit} seats</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
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
                Popular Choice
              </span>
            )}

            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 leading-normal">{plan.description}</p>
              
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{plan.price}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">/ month</span>
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
                    Creating Checkout...
                  </>
                ) : plan.current ? (
                  'Active Plan'
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Comparison Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
          <h3 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            Pricing & Plan Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-50/20 dark:bg-zinc-900/5">
                <th className="py-3 px-6">Feature Details</th>
                <th className="py-3 px-6">Free Plan</th>
                <th className="py-3 px-6">Pro Plan</th>
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
