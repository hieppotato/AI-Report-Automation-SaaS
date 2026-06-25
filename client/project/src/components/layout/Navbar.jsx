import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Menu,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User,
  Plus,
  Building,
  Check
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { useOrgStore } from '../../store/orgStore'
import { cn } from '../../lib/utils'
import { useBilling } from '../../hooks/useBilling'

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleSidebar, theme, setTheme } = useUIStore()
  const { profile, signOut } = useAuthStore()
  const { organizations, activeOrg, setActiveOrg } = useOrgStore()
  const { plan: billingPlan } = useBilling()
  const activePlan = (billingPlan?.plan || activeOrg?.plan || 'free').toUpperCase()

  // Dropdown states
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  // Ref handles for closing click outside
  const orgRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (orgRef.current && !orgRef.current.contains(event.target)) {
        setOrgDropdownOpen(false)
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Breadcrumbs resolver
  const pathnames = location.pathname.split('/').filter((x) => x)
  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
    const isLast = index === pathnames.length - 1
    const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ')

    return (
      <React.Fragment key={routeTo}>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        {isLast ? (
          <span className="font-semibold text-zinc-900 dark:text-zinc-50 truncate max-w-[120px] sm:max-w-xs">
            {displayName}
          </span>
        ) : (
          <Link
            to={routeTo}
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
          >
            {displayName}
          </Link>
        )}
      </React.Fragment>
    )
  })

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-4 backdrop-blur-md transition-colors duration-200">
      {/* Mobile open & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            to="/dashboard"
            className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
          >
            Home
          </Link>
          {breadcrumbs}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Org Switcher */}
        {activeOrg && (
          <div className="relative" ref={orgRef}>
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer select-none"
            >
              <Building className="w-3.5 h-3.5 text-zinc-400" />
              <span className="max-w-[100px] truncate">{activeOrg.name}</span>
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider",
                activePlan === 'PRO'
                  ? "bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border-brand-200/50 dark:border-brand-800/40"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
              )}>
                {activePlan}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {orgDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Workspaces
                </div>
                <div className="space-y-0.5 mt-1">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        setActiveOrg(org)
                        setOrgDropdownOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-all cursor-pointer gap-2",
                        org.id === activeOrg.id
                          ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="truncate">{org.name}</span>
                        <span className={cn(
                          "inline-flex items-center px-1 py-0.5 rounded text-[8px] font-semibold border uppercase tracking-wider flex-shrink-0",
                          org.plan === 'pro'
                            ? "bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border-brand-200/50 dark:border-brand-800/40"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                        )}>
                          {org.plan === 'pro' ? 'PRO' : 'FREE'}
                        </span>
                      </div>
                      {org.id === activeOrg.id && (
                        <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 my-1.5" />
                <button
                  onClick={() => {
                    setOrgDropdownOpen(false)
                    navigate('/organization') // Or redirect to a specialized onboarding view
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Workspace
                </button>
              </div>
            )}
          </div>
        )}

        {/* Theme Toggler */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile Menu */}
        {profile && (
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer select-none overflow-hidden"
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {profile.fullName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 shadow-lg animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                    {profile.fullName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {profile.email}
                  </p>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 my-1.5" />
                <div className="space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
