import React from 'react'

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 transition-colors duration-200">
      <div className="w-full max-w-[420px] rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/50 p-8 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-lg shadow-sm mb-4">
            R
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
