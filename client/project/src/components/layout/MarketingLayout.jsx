import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'

export function MarketingLayout({ children }) {
  const { session } = useAuthStore()
  const { theme, setTheme } = useUIStore()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans antialiased overflow-x-hidden transition-colors duration-200">
      {/* Dynamic Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(124,93,250,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(124,93,250,0.15),transparent_60%)] pointer-events-none z-0" />

      {/* Glassmorphic Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-900 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold tracking-tight text-lg text-zinc-900 dark:text-zinc-100">
              {t('marketing.brandName', { defaultValue: 'AI Report SaaS' })}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">{t('marketing.home', { defaultValue: 'Home' })}</Link>
            <Link to="/features" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">{t('marketing.features', { defaultValue: 'Features' })}</Link>
            <Link to="/pricing" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">{t('marketing.pricing', { defaultValue: 'Pricing' })}</Link>
            <Link to="/contact" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">{t('marketing.contact', { defaultValue: 'Contact' })}</Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageSwitcher />
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 cursor-pointer transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {session ? (
              <Link to="/dashboard" className="btn-primary h-9 px-4 gap-1.5 text-xs">
                {t('marketing.goToDashboard', { defaultValue: 'Dashboard' })}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-block text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  {t('marketing.login', { defaultValue: 'Log in' })}
                </Link>
                <Link to="/register" className="btn-primary h-9 px-4 text-xs font-semibold">
                  {t('marketing.getStarted', { defaultValue: 'Get Started' })}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10">{children}</main>

      {/* Modern SaaS Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 py-12 relative z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-500" />
            <span className="text-xs font-semibold text-zinc-500">
              {t('marketing.copyright', { defaultValue: '© 2026 AI Report SaaS. All rights reserved.' })}
            </span>
          </div>
          <div className="flex gap-6 text-xs text-zinc-500 font-semibold">
            <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-400 transition-colors">{t('marketing.privacy', { defaultValue: 'Privacy Policy' })}</Link>
            <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-400 transition-colors">{t('marketing.termsOfService', { defaultValue: 'Terms of Service' })}</Link>
            <Link to="/contact" className="hover:text-zinc-900 dark:hover:text-zinc-400 transition-colors">{t('marketing.support', { defaultValue: 'Support' })}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MarketingLayout
