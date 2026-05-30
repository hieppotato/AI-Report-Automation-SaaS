import React from 'react'
import { TrendingUp, AlertTriangle, AlertOctagon, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

export function InsightCard({ type = 'trend', title, description, impact }) {
  const normalized = type.toLowerCase()

  const config = {
    trend: {
      accentColor: 'border-blue-200/50 dark:border-blue-950/20 bg-blue-50/5 dark:bg-blue-950/5',
      glow: 'bg-blue-500/10 dark:bg-blue-500/5',
      badge: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200/20',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      label: 'Trend'
    },
    anomaly: {
      accentColor: 'border-amber-200/50 dark:border-amber-950/20 bg-amber-50/5 dark:bg-amber-950/5',
      glow: 'bg-amber-500/10 dark:bg-amber-500/5',
      badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/20',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'Anomaly'
    },
    risk: {
      accentColor: 'border-rose-200/50 dark:border-rose-950/20 bg-rose-50/5 dark:bg-rose-950/5',
      glow: 'bg-rose-500/10 dark:bg-rose-500/5',
      badge: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/20',
      icon: <AlertOctagon className="w-3.5 h-3.5" />,
      label: 'Risk'
    },
    recommendation: {
      accentColor: 'border-brand-200/50 dark:border-brand-950/20 bg-brand-50/5 dark:bg-brand-950/5',
      glow: 'bg-brand-500/10 dark:bg-brand-500/5',
      badge: 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400 border border-brand-200/20',
      icon: <Sparkles className="w-3.5 h-3.5 animate-pulse" />,
      label: 'Recommendation'
    },
  }

  const active = config[normalized] || config.trend

  return (
    <div className={cn(
      "card relative overflow-hidden group hover:shadow-md transition-all duration-300",
      active.accentColor
    )}>
      <div className={cn(
        "absolute -top-12 -right-12 h-24 w-24 rounded-full blur-xl group-hover:scale-150 transition-all duration-500",
        active.glow
      )} />

      <div className="flex items-center justify-between mb-3.5 relative z-10">
        <span className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase",
          active.badge
        )}>
          {active.icon}
          {active.label}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(description || title)
            const btn = document.getElementById(`copy-ins-${title}-${description.slice(0, 10)}`)
            if (btn) {
              btn.innerHTML = `<svg class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
              setTimeout(() => {
                btn.innerHTML = `<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
              }, 2000)
            }
          }}
          id={`copy-ins-${title}-${description.slice(0, 10)}`}
          className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800 text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer"
          title="Copy insight"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
      </div>

      <div className="relative z-10 space-y-1.5">
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{title}</h4>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">{description}</p>
        
        {impact && (
          <div className="pt-2 border-t border-zinc-100/50 dark:border-zinc-900/40 mt-3 flex items-center justify-between text-[10px] font-mono">
            <span className="text-zinc-400">Impact Assessment:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase">{impact}</span>
          </div>
        )}
      </div>
    </div>
  )
}
export default InsightCard
