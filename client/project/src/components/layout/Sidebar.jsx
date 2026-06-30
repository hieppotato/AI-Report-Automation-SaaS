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
  Sparkles,
  ClipboardList
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { cn } from '../../lib/utils'
import { useInvitations } from '../../hooks/useMembers'
import { useReports } from '../../hooks/useReports'
import { useTranslation } from 'react-i18next'

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { t } = useTranslation()

  // Queries for badge counts
  const { data: invitations = [] } = useInvitations()
  const { data: reportsResult } = useReports()

  const pendingCount = invitations.length
  const processingCount = reportsResult?.items?.filter(r => r.status === 'processing').length || 0

  const navItems = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.reports'), path: '/reports', icon: FileText, badge: processingCount },
    { name: t('nav.uploadData'), path: '/upload', icon: UploadCloud },
    { name: t('nav.teamMembers'), path: '/members', icon: Users, badge: pendingCount },
    { name: t('nav.billing'), path: '/billing', icon: CreditCard },
    { name: t('nav.orgSettings'), path: '/organization', icon: Settings },
    { name: t('nav.auditLogs'), path: '/audit-logs', icon: ClipboardList },
    { name: t('nav.userProfile'), path: '/profile', icon: User },
  ]

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Brand header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">
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
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2.5 py-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-50"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen ? (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate">{item.name}</span>
                    {item.badge > 0 && (
                      <span className={cn(
                        "ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-full font-mono shrink-0 min-w-[18px] text-center",
                        isActive
                          ? "bg-brand-500 text-white"
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="absolute left-14 z-50 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 opacity-0 shadow-md transition-opacity group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                    {item.name} {item.badge > 0 ? `(${item.badge})` : ''}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800">
        {!sidebarOpen ? (
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/40 p-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse-slow" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('nav.aiEngineActive')}</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t('nav.reportsAnalyzed')}
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
