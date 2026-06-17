import React, { useState } from 'react'
import { formatCurrency } from '../../lib/utils'

export function RevenueChart({ data = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null)
  
  if (data.length === 0) return null

  const width = 600
  const height = 240
  const paddingLeft = 50
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 30

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const coordinates = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth
    const y = paddingTop + chartHeight - ((d.value - min) / range) * chartHeight
    return { x, y, label: d.label, value: d.value }
  })

  const polylinePoints = coordinates.map((c) => `${c.x},${c.y}`).join(' ')
  const polygonPoints = `${coordinates[0].x},${paddingTop + chartHeight} ${polylinePoints} ${coordinates[coordinates.length - 1].x},${paddingTop + chartHeight}`

  const gridLines = 4
  const gridSlices = Array.from({ length: gridLines + 1 }, (_, i) => {
    const val = min + (i / gridLines) * range
    const y = paddingTop + chartHeight - (i / gridLines) * chartHeight
    return { y, value: val }
  })

  return (
    <div className="relative w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Revenue Trend</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Monthly overview of subscription and automated report revenues</p>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c5dfa" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#7c5dfa" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid guides & Y Axis */}
          {gridSlices.map((g, index) => (
            <g key={index}>
              <line
                x1={paddingLeft}
                y1={g.y}
                x2={width - paddingRight}
                y2={g.y}
                className="stroke-zinc-100 dark:stroke-zinc-800/80"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={g.y + 4}
                textAnchor="end"
                className="text-[10px] font-mono fill-zinc-400 dark:fill-zinc-600 font-medium"
              >
                {formatCurrency(g.value)}
              </text>
            </g>
          ))}

          {/* X Axis */}
          {coordinates.map((c, index) => (
            <text
              key={index}
              x={c.x}
              y={height - 8}
              textAnchor="middle"
              className="text-[10px] fill-zinc-400 dark:fill-zinc-500 font-medium"
            >
              {c.label}
            </text>
          ))}

          {/* Area gradient polygon */}
          <polygon points={polygonPoints} fill="url(#chart-area-grad)" />

          {/* Line string */}
          <polyline
            fill="none"
            stroke="#7c5dfa"
            strokeWidth={2.5}
            points={polylinePoints}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vertical tracking dashed line */}
          {hoverIndex !== null && (
            <line
              x1={coordinates[hoverIndex].x}
              y1={paddingTop}
              x2={coordinates[hoverIndex].x}
              y2={paddingTop + chartHeight}
              className="stroke-brand-500/30"
              strokeWidth={1.5}
              strokeDasharray="2 2"
            />
          )}

          {/* Highlight circles */}
          {coordinates.map((c, index) => (
            <circle
              key={index}
              cx={c.x}
              cy={c.y}
              r={hoverIndex === index ? 5 : 3.5}
              className={
                hoverIndex === index
                  ? "fill-brand-600 dark:fill-brand-400 stroke-white dark:stroke-zinc-950"
                  : "fill-white dark:fill-zinc-950 stroke-brand-600 dark:stroke-brand-500"
              }
              strokeWidth={2}
            />
          ))}

          {/* Hover hit areas */}
          {coordinates.map((c, index) => {
            const sliceWidth = chartWidth / (coordinates.length - 1)
            const triggerX = c.x - sliceWidth / 2
            
            return (
              <rect
                key={index}
                x={triggerX}
                y={paddingTop}
                width={sliceWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer pointer-events-auto"
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            )
          })}
        </svg>

        {/* Dynamic Tooltip Block */}
        {hoverIndex !== null && (
          <div
            className="absolute z-10 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 shadow-md backdrop-blur-sm pointer-events-none transition-all duration-75 text-xs"
            style={{
              left: `${(coordinates[hoverIndex].x / width) * 100}%`,
              top: `${(coordinates[hoverIndex].y / height) * 100 - 15}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              {coordinates[hoverIndex].label}
            </p>
            <p className="mt-0.5 text-brand-600 dark:text-brand-400 font-bold">
              {formatCurrency(coordinates[hoverIndex].value)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
export default RevenueChart
