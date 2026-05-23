import React from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useUIStore } from '../../store/uiStore'
import { cn } from '../../lib/utils'
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'

export function DashboardLayout({ children }) {
  const { sidebarOpen, toasts, removeToast } = useUIStore()

  const toastIcons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Viewport Container */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          sidebarOpen ? "pl-16 md:pl-64" : "pl-16"
        )}
      >
        <Navbar />
        
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Dynamic Floating Toast Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-lg backdrop-blur-md pointer-events-auto animate-in slide-in-from-bottom-2 fade-in"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toastIcons[toast.type] || toastIcons.info}
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
