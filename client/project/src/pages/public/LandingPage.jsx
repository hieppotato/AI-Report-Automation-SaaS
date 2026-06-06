import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, BarChart3, ShieldAlert, Cpu, CheckCircle2, ChevronRight, MessageSquare } from 'lucide-react'
import { MarketingLayout } from '../../components/layout/MarketingLayout'

export function LandingPage() {
  const features = [
    {
      icon: <Cpu className="w-5 h-5 text-brand-400" />,
      title: "Gemini AI pipeline",
      description: "Ingest CSV, PDF, and spreadsheets directly. Our cognitive pipeline parses complex cell structures instantly."
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-400" />,
      title: "Adaptive Data Analytics",
      description: "Interactive chart generators construct dynamic line charts, bars, and category slices straight from AI outputs."
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      title: "Autonomous Anomalies",
      description: "Get real-time alerts on cash flow anomalies, revenue drops, or outlier operational metrics."
    }
  ]

  const testimonials = [
    {
      quote: "AI Report Automation saved us 20+ hours of manual analysis every week. We just drag in our Stripe sales spreadsheets and get executive slide ready summaries.",
      author: "Sarah Jenkins",
      role: "VP of Operations, LinearScale"
    },
    {
      quote: "The anomalies detection engine caught a pricing configuration issue that would have cost us thousands. It pays for itself every single day.",
      author: "Marcus Chen",
      role: "Co-Founder, RetroDev"
    }
  ]

  const faqs = [
    {
      q: "What file formats does the platform support?",
      a: "Our parsing engines accept standard CSV spreadsheets, Excel worksheets (XLSX, XLS), and formatted PDF documents."
    },
    {
      q: "How does the Stripe Checkout system work?",
      a: "Upgrading to Pro calls a secure Stripe Checkout API. Once subscribed, Supabase handles your role upgrades automatically."
    },
    {
      q: "Are my business spreadsheets kept confidential?",
      a: "Yes. All data uploads are scoped to your specific tenant organization and encrypted using standard enterprise protocols."
    }
  ]

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Google Gemini Pro
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-50 max-w-4xl mx-auto leading-none">
          Turn Raw Worksheets Into{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-blue-500 to-purple-600">
            Actionable Intelligence
          </span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Upload spreadsheets, automatically detect transactional anomalies, compile interactive Recharts visualizations, and export PDF/DOCX summaries for your team.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register" className="btn-primary h-12 px-6 gap-2 text-xs font-semibold justify-center">
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/features" className="btn-secondary h-12 px-6 text-xs font-semibold justify-center border-zinc-850 hover:bg-zinc-900">
            Explore Features
          </Link>
        </div>

        {/* Floating Mockup Preview */}
        <div className="mt-20 border border-zinc-800 bg-zinc-900/40 rounded-2xl p-3 shadow-2xl relative max-w-5xl mx-auto backdrop-blur">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 via-transparent to-purple-500/5 pointer-events-none rounded-2xl" />
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 p-6 flex flex-col items-start text-left space-y-6 min-h-[300px]">
            <div className="flex justify-between items-center w-full pb-4 border-b border-zinc-900">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">WORKSPACE_TELEMETRY.JSON</span>
            </div>
            <div className="space-y-4 w-full">
              <div className="h-4 w-1/3 rounded bg-zinc-800/80 animate-pulse" />
              <div className="h-10 w-full rounded bg-zinc-900/60 animate-pulse" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-24 rounded bg-zinc-900/40 border border-zinc-900 animate-pulse" />
                <div className="h-24 rounded bg-zinc-900/40 border border-zinc-900 animate-pulse" />
                <div className="h-24 rounded bg-zinc-900/40 border border-zinc-900 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-zinc-900 bg-zinc-950/40 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-50">Ingestion Features Designed for Scale</h2>
            <p className="mt-4 text-xs sm:text-sm text-zinc-400">
              No manual copy-pasting. Our advanced integrations handle parsing, summarizing, and data plotting out-of-the-box.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((item, idx) => (
              <div key={idx} className="card bg-zinc-900/30 border-zinc-900 hover:border-zinc-800 transition-colors p-6 flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 mb-5">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100">{item.title}</h3>
                  <p className="mt-2.5 text-xs text-zinc-400 leading-normal">{item.description}</p>
                </div>
                <Link to="/register" className="mt-6 inline-flex items-center text-xs font-semibold text-brand-400 hover:text-brand-300 group">
                  Learn more <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-zinc-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-50">Trusted by Professional Analysts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((item, idx) => (
              <div key={idx} className="card p-6 bg-zinc-900/20 border-zinc-900 space-y-4 flex flex-col justify-between">
                <p className="text-xs text-zinc-350 italic leading-relaxed">
                  "{item.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center font-bold text-[10px] text-brand-400 uppercase">
                    {item.author.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">{item.author}</h4>
                    <p className="text-[10px] text-zinc-500">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-zinc-900 py-20 bg-zinc-950/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-center text-zinc-50 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card p-5 border-zinc-900 bg-zinc-900/10 space-y-2.5">
                <h3 className="text-xs font-bold text-zinc-200">{faq.q}</h3>
                <p className="text-xs text-zinc-400 leading-normal">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-900 py-20 text-center bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-50">Ready to Automate Business Reporting?</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Register your workspace, invite your team, and upload your raw datasets to generate executive summaries in seconds.
          </p>
          <Link to="/register" className="btn-primary h-12 px-8 inline-flex gap-2 text-xs font-semibold justify-center items-center">
            Get Started Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}

export default LandingPage
