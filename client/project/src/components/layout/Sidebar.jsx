import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Users,
  CreditCard,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Upload Data', path: '/upload', icon: UploadCloud },
    { name: 'Team Members', path: '/members', icon: Users },
    { name: 'Billing', path: '/billing', icon: CreditCard },
    { name: 'Org Settings', path: '/organization', icon: Settings },
    { name: 'User Profile', path: '/profile', icon: User },
  ]

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
            R
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight text-sm flex items-center gap-1.5">
              Reportly
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-200/30">
                AI
              </span>
            </span>
          )}
        </div>
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-50"
              )
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen ? (
              <span className="truncate">{item.name}</span>
            ) : (
              <span className="absolute left-14 z-50 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 opacity-0 shadow-md transition-opacity group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                {item.name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        {!sidebarOpen ? (
          <button
            onClick={toggleSidebar}
            className="flex h-10 w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/40 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">AI Engine Active</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              Reports automatically analyzed for anomalies.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
