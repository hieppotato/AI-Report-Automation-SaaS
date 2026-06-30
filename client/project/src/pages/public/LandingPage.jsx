import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, BarChart3, ShieldAlert, Cpu, ChevronRight } from 'lucide-react'
import { MarketingLayout } from '../../components/layout/MarketingLayout'

export function LandingPage() {
  const { t } = useTranslation()
  const features = [
    {
      icon: <Cpu className="w-5 h-5 text-brand-600 dark:text-brand-400" />,
      titleKey: 'landing.feature1Title',
      descKey: 'landing.feature1Desc',
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      titleKey: 'landing.feature2Title',
      descKey: 'landing.feature2Desc',
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      titleKey: 'landing.feature3Title',
      descKey: 'landing.feature3Desc',
    }
  ]

  const testimonials = [
    {
      quoteKey: 'landing.testimonial1Quote',
      author: "Sarah Jenkins",
      role: "VP of Operations, LinearScale"
    },
    {
      quoteKey: 'landing.testimonial2Quote',
      author: "Marcus Chen",
      role: "Co-Founder, RetroDev"
    }
  ]

  const faqs = [
    {
      qKey: 'landing.faq1Q',
      aKey: 'landing.faq1A',
    },
    {
      qKey: 'landing.faq2Q',
      aKey: 'landing.faq2A',
    },
    {
      qKey: 'landing.faq3Q',
      aKey: 'landing.faq3A',
    }
  ]

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-4xl mx-auto leading-none">
          Turn Raw Worksheets Into{" "}
          <span className="text-brand-600 dark:text-brand-400">
            {t('landing.heroHighlight', { defaultValue: 'Intelligent Reports' })}
          </span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {t('landing.heroSubtitle', { defaultValue: 'Automate your data analysis and generate comprehensive reports in seconds, not hours.' })}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register" className="btn-primary h-12 px-6 gap-2 text-sm justify-center">
            {t('landing.heroCtaPrimary', { defaultValue: 'Start building' })}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/features" className="btn-secondary h-12 px-6 text-sm justify-center">
            {t('landing.heroCtaSecondary', { defaultValue: 'View features' })}
          </Link>
        </div>

        {/* Abstract Hero Image Placeholder */}
        <div className="mt-20 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl p-4 shadow-xl relative max-w-5xl mx-auto backdrop-blur flex items-center justify-center min-h-[400px]">
          <div className="text-zinc-400 dark:text-zinc-600 text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('landing.previewPlaceholder', { defaultValue: 'Product Dashboard Preview' })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/40 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('landing.featuresTitle', { defaultValue: 'Built for precision' })}</h2>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              {t('landing.featuresSubtitle', { defaultValue: 'Everything you need to scale your reporting operations.' })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((item, idx) => (
              <div key={idx} className="card bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors p-6 flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 mb-5">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t(item.titleKey, { defaultValue: 'Core Feature' })}</h3>
                  <p className="mt-2.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{t(item.descKey, { defaultValue: 'Deliver better insights with our robust analytics engine.' })}</p>
                </div>
                <Link to="/register" className="mt-6 inline-flex items-center text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 group">
                  {t('landing.learnMore', { defaultValue: 'Learn more' })} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-zinc-200 dark:border-zinc-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('landing.testimonialsTitle', { defaultValue: 'Trusted by teams' })}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((item, idx) => (
              <div key={idx} className="card p-6 bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-900 space-y-6 flex flex-col justify-between">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  "{t(item.quoteKey, { defaultValue: 'This platform completely transformed our workflow.' })}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 flex items-center justify-center font-bold text-xs text-brand-700 dark:text-brand-400 uppercase">
                    {item.author.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{item.author}</h4>
                    <p className="text-xs text-zinc-500">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-zinc-200 dark:border-zinc-900 py-24 bg-zinc-50 dark:bg-zinc-950/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-center text-zinc-900 dark:text-zinc-50 mb-12">{t('landing.faqTitle', { defaultValue: 'Common questions' })}</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card p-6 border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 space-y-3">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{t(faq.qKey, { defaultValue: 'How does it work?' })}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{t(faq.aKey, { defaultValue: 'Simply connect your data sources and our engine handles the rest.' })}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-200 dark:border-zinc-900 py-24 text-center bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">{t('landing.ctaTitle', { defaultValue: 'Ready to scale?' })}</h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            {t('landing.ctaSubtitle', { defaultValue: 'Join thousands of users generating reports intelligently.' })}
          </p>
          <Link to="/register" className="btn-primary h-12 px-8 inline-flex gap-2 text-sm justify-center items-center">
            {t('landing.ctaButton', { defaultValue: 'Get started for free' })}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}

export default LandingPage
