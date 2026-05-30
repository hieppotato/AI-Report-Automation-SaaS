import React from 'react'

export function LoadingState({ type = 'table', count = 3 }) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="card animate-pulse space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'charts') {
    return (
      <div className="card animate-pulse space-y-4 h-64 flex flex-col justify-end p-6">
        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 mb-auto" />
        <div className="flex items-end justify-between gap-4 h-36">
          <div className="h-20 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-28 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-16 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-32 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-24 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden animate-pulse">
      <div className="h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10" />
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 p-4 space-y-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between py-2">
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-850" />
              <div className="h-3 w-24 rounded bg-zinc-150 dark:bg-zinc-850" />
            </div>
            <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-850" />
            <div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-850" />
          </div>
        ))}
      </div>
    </div>
  )
}
export default LoadingState
