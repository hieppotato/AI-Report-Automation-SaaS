import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export function MarketingLayout({ children }) {
  const { session } = useAuthStore()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans antialiased overflow-x-hidden">
      {/* Dynamic Stripe-style Glowing Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(124,93,250,0.15),transparent_60%)] pointer-events-none z-0" />

      {/* Glassmorphic Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 to-zinc-300">
              AI Report Automation
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-400">
            <Link to="/" className="hover:text-zinc-100 transition-colors">Home</Link>
            <Link to="/features" className="hover:text-zinc-100 transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-zinc-100 transition-colors">Pricing</Link>
            <Link to="/contact" className="hover:text-zinc-100 transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            {session ? (
              <Link to="/dashboard" className="btn-primary h-9 px-4 gap-1.5 text-xs">
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary h-9 px-4 text-xs font-semibold">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10">{children}</main>

      {/* Modern SaaS Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-semibold text-zinc-500">
              © 2026 AI Report Automation SaaS. Powered by Gemini. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6 text-xs text-zinc-500 font-semibold">
            <Link to="/" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link to="/" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-zinc-400 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MarketingLayout
