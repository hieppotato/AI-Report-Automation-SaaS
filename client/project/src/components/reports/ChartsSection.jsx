import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

export function ChartsSection({ charts }) {
  const COLORS = ['#7c5dfa', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']

  // Normalize charts to a list of standard chart objects
  const parseCharts = () => {
    if (!charts) return []
    
    // Case 1: charts is a list
    if (Array.isArray(charts)) {
      return charts.map((c, i) => {
        const type = (c?.type || c?.chart_type || 'line').toLowerCase()
        const title = c?.title || c?.name || `Metric Visualization #${i + 1}`
        
        let data = []
        if (Array.isArray(c?.data)) {
          data = c.data
        } else if (Array.isArray(c?.labels) && Array.isArray(c?.values)) {
          data = c.labels.map((label, idx) => {
            const val = Number(c.values[idx])
            const row = {
              label: String(label),
              name: String(label),
              value: Number.isFinite(val) ? val : 0
            }
            // Include secondary series if present, e.g. orders
            if (c.orders && c.orders[idx] !== undefined) {
              row.orders = Number(c.orders[idx]) || 0
            }
            if (c.revenue && c.revenue[idx] !== undefined) {
              row.revenue = Number(c.revenue[idx]) || 0
            }
            return row
          })
        }
        
        return { type, title, data }
      }).filter(c => c.data.length > 0)
    }

    // Case 2: charts is a dictionary mapping chart names to data
    if (typeof charts === 'object') {
      return Object.entries(charts).map(([key, c]) => {
        if (!c) return null
        const type = (c?.type || c?.chart_type || (key.toLowerCase().includes('line') ? 'line' : key.toLowerCase().includes('pie') ? 'pie' : 'bar')).toLowerCase()
        const title = c?.title || c?.name || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        
        let data = []
        if (Array.isArray(c?.data)) {
          data = c.data
        } else if (Array.isArray(c?.labels) && Array.isArray(c?.values)) {
          data = c.labels.map((label, idx) => {
            const val = Number(c.values[idx])
            const row = {
              label: String(label),
              name: String(label),
              value: Number.isFinite(val) ? val : 0
            }
            if (c.orders && c.orders[idx] !== undefined) {
              row.orders = Number(c.orders[idx]) || 0
            }
            if (c.revenue && c.revenue[idx] !== undefined) {
              row.revenue = Number(c.revenue[idx]) || 0
            }
            return row
          })
        } else if (Array.isArray(c)) {
          // If it's directly an array of items
          data = c.map(item => {
            if (typeof item === 'object') {
              return {
                label: item.label || item.name || '',
                name: item.name || item.label || '',
                value: Number(item.value || item.revenue || 0)
              }
            }
            return { label: String(item), name: String(item), value: 0 }
          })
        }

        return { type, title, data }
      }).filter(Boolean).filter(c => c.data.length > 0)
    }

    return []
  }

  const parsedCharts = parseCharts()

  if (parsedCharts.length === 0) {
    return (
      <div className="card py-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 rounded-2xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 mx-auto mb-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">No telemetry charts available</h4>
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
          AI generated charts and metric series will dynamically render here after compilation.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {parsedCharts.map((chart, index) => {
        const isLine = ['line', 'timeseries', 'trend'].includes(chart.type)
        const isPie = ['pie', 'distribution', 'donut'].includes(chart.type)
        const isBar = !isLine && !isPie // default to bar

        return (
          <div 
            key={`${chart.title}-${index}`} 
            className={chart.type === 'pie' ? "card lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6" : "card"}
          >
            {chart.type === 'pie' ? (
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">{chart.title}</h4>
                <p className="text-[11px] text-zinc-500 leading-normal max-w-sm">
                  Breakdown distribution generated from your ingested report records.
                </p>
              </div>
            ) : (
              <h4 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 mb-4 uppercase tracking-wider">{chart.title}</h4>
            )}

            <div className={chart.type === 'pie' ? "h-60 w-full md:w-80 flex-shrink-0" : "h-60 w-full"}>
              <ResponsiveContainer width="100%" height="100%">
                {isLine ? (
                  <LineChart data={chart.data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" className="hidden dark:block" />
                    <XAxis dataKey="label" stroke="#888888" fontSize={9} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#7c5dfa" strokeWidth={2.5} activeDot={{ r: 6 }} name="Value" />
                    {chart.data[0]?.revenue !== undefined && (
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} name="Revenue ($)" />
                    )}
                    {chart.data[0]?.orders !== undefined && (
                      <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2.5} name="Orders" />
                    )}
                  </LineChart>
                ) : isBar ? (
                  <BarChart data={chart.data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" className="hidden dark:block" />
                    <XAxis dataKey="label" stroke="#888888" fontSize={9} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Bar dataKey="value" fill="#7c5dfa" radius={[4, 4, 0, 0]}>
                      {chart.data.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={chart.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chart.data.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ChartsSection
