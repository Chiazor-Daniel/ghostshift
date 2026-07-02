import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import MarketingNav from '../components/MarketingNav.jsx'
import MarketingFooter from '../components/MarketingFooter.jsx'
import { pricingTiers } from '../data/mock.js'

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly')

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <MarketingNav />

      <section className="relative py-xl overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
        <div className="relative max-w-[1280px] mx-auto px-lg lg:px-xl text-center">
          <span className="font-label-md text-label-md text-primary uppercase tracking-wider">
            Pricing
          </span>
          <h1 className="mt-md font-display-lg text-display-lg text-on-surface leading-tight">
            Simple pricing.{' '}
            <span className="bg-gradient-to-r from-primary to-accent-600 bg-clip-text text-transparent">
              Powerful outcomes.
            </span>
          </h1>
          <p className="mt-md font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Pick the plan that matches your team size. Switch or cancel anytime — no hidden fees,
            no setup charges.
          </p>

          <div className="mt-lg inline-flex items-center gap-1 bg-surface-variant/60 p-1 rounded-xl border border-outline-variant/30">
            {['monthly', 'annual'].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`px-md py-sm rounded-lg font-label-md text-label-md transition-all ${
                  billing === b
                    ? 'bg-white shadow-soft-sm text-primary font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                {b === 'monthly' ? 'Monthly' : 'Annual'}
                {b === 'annual' && (
                  <span className="ml-sm chip bg-success/10 text-success text-[10px]">Save 20%</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-xl">
        <div className="max-w-[1280px] mx-auto px-lg lg:px-xl">
          <div className="grid md:grid-cols-3 gap-md">
            {pricingTiers.map((tier, i) => {
              const price =
                tier.price === 'Custom'
                  ? 'Custom'
                  : billing === 'annual'
                    ? `$${Math.round(parseInt(tier.price.replace('$', '')) * 0.8)}`
                    : tier.price
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-2xl p-lg border ${
                    tier.highlight
                      ? 'bg-gradient-to-br from-primary to-accent-600 text-on-primary border-transparent shadow-soft-xl'
                      : 'bg-white border-outline-variant/30 shadow-soft-md'
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-on-primary font-label-sm text-[10px] font-bold uppercase tracking-wider shadow-soft-md">
                      Most popular
                    </div>
                  )}

                  <h3
                    className={`font-headline-md text-lg font-bold ${
                      tier.highlight ? 'text-on-primary' : 'text-on-surface'
                    }`}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className={`mt-sm font-body-sm text-body-sm ${
                      tier.highlight ? 'text-on-primary/80' : 'text-on-surface-variant'
                    }`}
                  >
                    {tier.description}
                  </p>

                  <div className="mt-lg flex items-baseline gap-1">
                    <span
                      className={`font-display-lg text-display-lg ${
                        tier.highlight ? 'text-on-primary' : 'text-on-surface'
                      }`}
                    >
                      {price}
                    </span>
                    {tier.per && (
                      <span
                        className={`font-label-sm text-label-sm ${
                          tier.highlight ? 'text-on-primary/70' : 'text-on-surface-variant'
                        }`}
                      >
                        {tier.per}
                      </span>
                    )}
                  </div>

                  <Link
                    to="/login"
                    className={`mt-md inline-flex items-center justify-center w-full rounded-lg px-md py-sm font-label-md text-label-md transition-all ${
                      tier.highlight
                        ? 'bg-white text-primary hover:bg-white/90 shadow-soft-md'
                        : 'bg-primary text-on-primary hover:bg-primary-700'
                    }`}
                  >
                    {tier.cta}
                  </Link>

                  <ul className="mt-lg space-y-sm">
                    {tier.features.map((f, j) => (
                      <li
                        key={j}
                        className={`flex items-start gap-sm font-body-sm text-body-sm ${
                          tier.highlight ? 'text-on-primary/95' : 'text-on-surface-variant'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] flex-shrink-0 ${
                            tier.highlight ? 'text-on-primary' : 'text-success'
                          }`}
                        >
                          check_circle
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ-ish */}
      <section className="py-xl border-t border-outline-variant/30">
        <div className="max-w-3xl mx-auto px-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface text-center mb-xl">
            Frequently asked questions
          </h2>
          <div className="space-y-md">
            {[
              {
                q: 'How long does implementation take?',
                a: 'Most teams are live within 1-2 weeks. We provide white-glove onboarding including data import from your existing scheduling system (Workday, Kronos, UKG, etc.), SSO setup, and policy configuration.',
              },
              {
                q: 'Is GhostShift HIPAA-compliant?',
                a: 'Yes. We sign a BAA with every customer, encrypt all PHI at rest and in transit (AES-256, TLS 1.3), and maintain SOC 2 Type II certification. Audit logs are immutable and exportable.',
              },
              {
                q: 'Can staff use it on mobile?',
                a: 'Yes — iOS and Android apps with biometric login, push notifications for shift changes, and one-tap swap requests. The web app is also fully responsive.',
              },
              {
                q: 'What happens to my data if I cancel?',
                a: 'You can export all data in standard formats (CSV, JSON, iCal) at any time. After cancellation, we retain data for 30 days for recovery, then permanently delete it within 90 days.',
              },
              {
                q: 'Do you offer discounts for non-profits or academic medical centers?',
                a: 'Yes — 30% off list price for 501(c)(3) non-profits and academic institutions. Contact sales for details.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-outline-variant/30 p-md open:shadow-soft-sm transition-shadow"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    {item.q}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <p className="mt-md font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}