import React from 'react'
import { Check, CreditCard, Sparkles, Zap } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useOrgStore } from '../store/orgStore'
import { useUIStore } from '../store/uiStore'

export function BillingPage() {
  const { activeOrg, setActiveOrg } = useOrgStore()
  const { addToast } = useUIStore()

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Ideal for basic solo analyst workflows.',
      features: [
        '3 Processed reports per month',
        'Basic CSV upload ingestion',
        'Standard SVG trend sparklines',
        '1 Member seat',
      ],
      cta: 'Current Plan',
      current: activeOrg?.plan === 'Free' || !activeOrg?.plan,
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
        'Stripe billing support',
      ],
      cta: 'Upgrade to Pro',
      current: activeOrg?.plan === 'Pro',
    },
    {
      name: 'Enterprise',
      price: '$199',
      description: 'Custom scaled controls for large companies.',
      features: [
        'Unlimited processed reports',
        'Dedicated custom AI model tuning',
        'Dedicated SLA & 24/7 client care',
        'Unlimited workspace members',
        'Advanced security & single sign-on',
      ],
      cta: 'Contact Sales',
      current: activeOrg?.plan === 'Enterprise',
    },
  ]

  const handleUpgrade = (planName) => {
    if (planName === 'Enterprise') {
      addToast('Connecting you with our sales representative...', 'info')
      return
    }
    
    if (activeOrg) {
      const updatedOrg = { ...activeOrg, plan: planName }
      setActiveOrg(updatedOrg)
      addToast(`Workspace upgraded to ${planName} Plan successfully!`, 'success')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">Billing & Subscriptions</h1>
        <p className="text-sm text-zinc-500 mt-1">Govern subscription metrics, track ingestion quotas, and upgrade plans.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-zinc-400" />
              Monthly Reports Quota
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-400">12 / 100 reports ingested</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mt-3">
            <div className="h-full rounded-full bg-brand-600" style={{ width: '12%' }} />
          </div>
          <p className="mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            Resets on June 1, 2026. Free plans receive 3 maximum.
          </p>
        </div>

        <div className="card">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-zinc-400" />
              Workspace Seat Quota
            </span>
            <span className="font-mono text-zinc-500 dark:text-zinc-400">3 / 5 seats utilized</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-150 dark:bg-zinc-900 overflow-hidden mt-3">
            <div className="h-full rounded-full bg-brand-600" style={{ width: '60%' }} />
          </div>
          <p className="mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            Upgrades to Enterprise remove workspace seat constraints.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`card relative overflow-hidden flex flex-col justify-between ${
              plan.current
                ? 'border-brand-500 dark:border-brand-600 shadow-md ring-1 ring-brand-500'
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
                onClick={() => handleUpgrade(plan.name)}
                disabled={plan.current}
                className={
                  plan.current
                    ? 'btn-secondary w-full h-10 select-none bg-zinc-50 dark:bg-zinc-900/60 font-semibold cursor-not-allowed'
                    : 'btn-primary w-full h-10 cursor-pointer'
                }
              >
                {plan.current ? 'Active Plan' : plan.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
export default BillingPage
