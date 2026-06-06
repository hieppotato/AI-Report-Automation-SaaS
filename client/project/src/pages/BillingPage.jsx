import React from 'react'
import { Check, CreditCard, Sparkles, Zap, Loader2, HelpCircle } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useBilling } from '../hooks/useBilling'
import { useReports } from '../hooks/useReports'
import { useMembers } from '../hooks/useMembers'
import { useOrgStore } from '../store/orgStore'

export function BillingPage() {
  const activeOrg = useOrgStore((state) => state.activeOrg)
  const { plan: apiPlan, isLoading: planLoading, upgradeToPro, isUpgrading } = useBilling()
  const { data: reportsResult } = useReports()
  const { data: membersResult } = useMembers()

  const reportCount = reportsResult?.items?.length || 0
  const memberCount = membersResult?.items?.length || 0

  // Standardize plan active state from API or store fallback
  const activePlanName = (apiPlan?.plan || activeOrg?.plan || 'free').toLowerCase()
  const isPro = activePlanName === 'pro'

  const handleUpgrade = async (planName) => {
    if (planName === 'pro') {
      try {
        await upgradeToPro()
      } catch (err) {
        // handled in hook
      }
    }
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
      cta: 'Current Plan',
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
        'Stripe billing integration',
      ],
      cta: 'Upgrade Now',
      current: isPro,
    },
  ]

  const comparisons = [
    { feature: 'Monthly Ingest Limit', free: '3 reports', pro: '100 reports' },
    { feature: 'File Formats', free: 'CSV only', pro: 'CSV, XLSX, XLS, PDF' },
    { feature: 'AI Diagnostics', free: 'No', pro: 'Yes, full suite' },
    { feature: 'Seat Allowance', free: '1 member', pro: '5 members' },
    { feature: 'Support Tier', free: 'Community', pro: 'Priority Email' },
    { feature: 'Stripe Billing', free: 'No', pro: 'Yes' },
  ]

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Billing & Subscriptions</h1>
        <p className="text-sm text-zinc-500 mt-1">Govern subscription metrics, track usage quotas, and manage plan tiers.</p>
      </div>

      {/* Usage Quotas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-zinc-400" />
              Monthly Ingestion Quota
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-450">
              {reportCount} / {isPro ? 100 : 3} reports used
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mt-3">
            <div 
              className="h-full rounded-full bg-brand-650 transition-all duration-500" 
              style={{ width: `${Math.min(100, (reportCount / (isPro ? 100 : 3)) * 100)}%` }} 
            />
          </div>
          <p className="mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            {isPro ? 'Pro plan allows up to 100 generated reports.' : 'Upgrade to Pro to expand limit to 100 monthly reports.'}
          </p>
        </div>

        <div className="card">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-zinc-400" />
              Workspace Seat Quota
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-450">
              {memberCount} / {isPro ? 5 : 1} seats utilized
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mt-3">
            <div 
              className="h-full rounded-full bg-brand-650 transition-all duration-500" 
              style={{ width: `${Math.min(100, (memberCount / (isPro ? 5 : 1)) * 100)}%` }} 
            />
          </div>
          <p className="mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            {isPro ? 'Pro plan includes up to 5 team seats.' : 'Free plan limits workspace access to 1 seat.'}
          </p>
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
                    <Loader2 className="w-4 h-4 animate-spin" />
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
