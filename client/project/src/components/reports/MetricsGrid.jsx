import React from 'react'
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/utils'

export function MetricsGrid({ metrics }) {
  const {
    totalRevenue = 0,
    totalOrders = 0,
    averageOrderValue = 0,
    repeatCustomerRate = 0,
  } = metrics || {}

  const list = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), desc: 'Aggregated net receipts' },
    { label: 'Total Orders', value: formatNumber(totalOrders), desc: 'Completed checkout sessions' },
    { label: 'Average Order Value', value: formatCurrency(averageOrderValue), desc: 'Mean cart size metrics' },
    { label: 'Repeat Rate', value: formatPercentage(repeatCustomerRate), desc: 'Returning customer index' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {list.map((m, idx) => (
        <div key={idx} className="card hover:border-zinc-300 dark:hover:border-zinc-800 transition-all duration-200">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{m.label}</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">
            {m.value}
          </p>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1">{m.desc}</p>
        </div>
      ))}
    </div>
  )
}
export default MetricsGrid
