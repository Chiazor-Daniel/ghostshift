import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import MarketingNav from '../components/MarketingNav.jsx'
import MarketingFooter from '../components/MarketingFooter.jsx'
import Logo from '../components/Logo.jsx'
import { heroStats, testimonials, featurePillars, integrationLogos, pricingTiers } from '../data/mock.js'

// Animated gradient mesh background
function GradientMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-0 w-[700px] h-[500px] rounded-full bg-primary-300/10 blur-3xl animate-pulse-soft" style={{ animationDelay: '4s' }} />
      <div className="absolute inset-0 grid-pattern opacity-[0.3]" />
    </div>
  )
}

// Floating UI chip — used as visual texture in hero
function FloatingChip({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className={`absolute bg-surface rounded-xl shadow-soft-md p-md ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <div className="min-h-screen bg-background text-on-surface overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section ref={heroRef} className="relative pt-xl pb-xl overflow-hidden">
        <GradientMesh />
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative max-w-[1280px] mx-auto px-lg lg:px-xl"
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-sm chip bg-primary/10 text-primary border border-primary/20 mb-md"
            >
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              <span className="font-label-md">Now with LLM-powered scheduling assistant</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display-lg text-display-lg text-on-surface leading-[1.05] tracking-tight"
            >
              Shift work that{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-primary to-accent-600 bg-clip-text text-transparent">
                  doesn't burn people out
                </span>
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  viewBox="0 0 200 12"
                  className="absolute -bottom-1 left-0 w-full h-2"
                >
                  <motion.path
                    d="M2 9 Q 50 2, 100 7 T 198 5"
                    stroke="url(#underline-grad)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="underline-grad" x1="0" x2="1">
                      <stop offset="0" stopColor="#0ea5e9" />
                      <stop offset="1" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-lg font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto"
            >
              GhostShift uses constraint-satisfaction AI to match swaps in seconds and a LightGBM
              model to predict burnout weeks before it happens. Built for hospitals that take care
              of their people.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-xl flex flex-wrap items-center justify-center gap-md"
            >
              <Link to="/login" className="btn-primary px-lg py-md text-base shadow-soft-lg">
                Start free trial
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <a href="#how" className="btn-secondary px-lg py-md text-base">
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                Watch 90-sec demo
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-md font-label-sm text-label-sm text-on-surface-variant"
            >
              14-day free trial · No credit card · HIPAA-compliant from day 1
            </motion.p>
          </div>

          {/* Hero product mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mt-xl max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden border border-outline-variant/40 shadow-soft-xl bg-surface/90 backdrop-blur">
              <div className="flex items-center gap-sm px-md py-sm border-b border-outline-variant/30 bg-surface-container-low/80">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-md">
                  <div className="max-w-md mx-auto rounded-md bg-surface-container-low border border-outline-variant/30 px-md py-1 text-center font-label-sm text-label-sm text-on-surface-variant">
                    app.ghostshift.io / manager-dashboard
                  </div>
                </div>
              </div>

              {/* Mock dashboard */}
              <div className="grid grid-cols-12 h-[480px] bg-background">
                <div className="col-span-2 border-r border-outline-variant/30 p-md space-y-sm bg-surface">
                  <div className="flex items-center gap-sm mb-md">
                    <Logo size={28} />
                    <div className="font-headline-md text-sm font-bold">GhostShift</div>
                  </div>
                  {[
                    ['dashboard', 'Dashboard', true],
                    ['swap_horiz', 'Swaps'],
                    ['storefront', 'Market'],
                    ['monitor_heart', 'Health'],
                    ['settings', 'Settings'],
                  ].map(([icon, label, active]) => (
                    <div
                      key={label}
                      className={`flex items-center gap-sm px-sm py-1.5 rounded-md text-label-sm ${
                        active ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{icon}</span>
                      {label}
                    </div>
                  ))}
                </div>

                <div className="col-span-10 p-md">
                  <div className="grid grid-cols-3 gap-sm mb-md">
                    {[
                      { label: 'Unfilled', value: '14', color: 'text-error', trend: '+3', icon: 'warning' },
                      { label: 'Active Staff', value: '128', color: 'text-on-surface', trend: '94% util', icon: 'group' },
                      { label: 'Burnout Risk', value: 'High', color: 'text-error', trend: '3 depts', icon: 'monitor_heart' },
                    ].map((s, i) => (
                      <div key={i} className="bg-surface rounded-lg border border-outline-variant/30 p-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {s.label}
                          </span>
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                            {s.icon}
                          </span>
                        </div>
                        <div className={`font-headline-md text-xl ${s.color}`}>{s.value}</div>
                        <div className="font-label-sm text-[10px] text-on-surface-variant">
                          {s.trend}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-sm h-[300px]">
                    <div className="col-span-2 bg-surface rounded-lg border border-outline-variant/30 p-md">
                      <div className="flex items-center justify-between mb-md">
                        <h3 className="font-label-md text-label-md font-bold">Weekly Schedule</h3>
                        <div className="flex gap-1 text-[10px] font-label-sm">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">Week</span>
                          <span className="px-2 py-0.5 rounded text-on-surface-variant">Month</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 h-[220px]">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                          <div key={d} className="flex flex-col gap-1">
                            <div className="text-center text-[10px] font-label-sm text-on-surface-variant">
                              {d}
                            </div>
                            {[
                              { h: 1, c: 'bg-primary' },
                              { h: 2, c: 'bg-surface-variant' },
                              { h: 1, c: i === 2 ? 'bg-error/30 border border-dashed border-error/50' : 'bg-accent-600/80' },
                              { h: 2, c: 'bg-surface-variant' },
                              { h: 1, c: i === 4 ? 'bg-sky-500/70' : 'bg-amber-400/70' },
                            ].map((s, j) => (
                              <div
                                key={j}
                                className={`${s.c} rounded-sm h-${s.h * 8} flex items-center justify-center text-[8px] text-white font-bold`}
                                style={{ height: `${s.h * 32 + 8}px` }}
                              >
                                {j === 2 && i === 2 && '+'}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-surface rounded-lg border border-outline-variant/30 p-md flex flex-col">
                      <div className="flex items-center gap-sm mb-md">
                        <span className="material-symbols-outlined text-primary text-[16px]">auto_awesome</span>
                        <h3 className="font-label-md text-label-md font-bold">AI Match</h3>
                      </div>
                      <div className="space-y-sm flex-1">
                        {[
                          ['Dr. Elena Rostova', '98%', true],
                          ['Marcus Vance', '92%', true],
                          ['Sarah Kline', '75%', false],
                        ].map(([n, p, hot], i) => (
                          <div key={i} className="flex items-center gap-sm">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                              {n.split(' ').map((w) => w[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-label-sm text-[10px] font-bold truncate">{n}</div>
                              <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${hot ? 'bg-primary' : 'bg-on-surface-variant'}`}
                                  style={{ width: p }}
                                />
                              </div>
                            </div>
                            <span className="font-label-sm text-[10px] font-bold text-primary">
                              {p}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating decorative cards */}
            <FloatingChip className="hidden lg:flex items-center gap-sm top-12 -left-12" delay={0.7}>
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-success">check_circle</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Swap matched</div>
                <div className="font-label-md text-label-md font-bold text-on-surface">ICU-B · 0.8s</div>
              </div>
            </FloatingChip>

            <FloatingChip className="hidden lg:flex items-center gap-sm top-32 -right-8" delay={0.9}>
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error">monitor_heart</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Burnout prevented</div>
                <div className="font-label-md text-label-md font-bold text-on-surface">Marcus V.</div>
              </div>
            </FloatingChip>

            <FloatingChip className="hidden lg:flex items-center gap-sm bottom-12 -left-16" delay={1.1}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">chat</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Shift Assistant</div>
                <div className="font-label-md text-label-md font-bold text-on-surface">"Swap Friday?"</div>
              </div>
            </FloatingChip>
          </motion.div>
        </motion.div>
      </section>

      {/* Logos */}
      <section className="relative border-y border-outline-variant/30 bg-surface-container-lowest/40 backdrop-blur-sm py-xl">
        <div className="max-w-[1280px] mx-auto px-lg lg:px-xl">
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant uppercase tracking-[0.2em]">
            Trusted by 200+ healthcare teams
          </p>
          <div className="mt-lg grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-lg items-center justify-items-center">
            {integrationLogos.map((logo) => (
              <div
                key={logo}
                className="font-headline-md text-base font-bold text-on-surface-variant/60 hover:text-on-surface transition-colors"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-xl">
        <div className="max-w-[1280px] mx-auto px-lg lg:px-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
            {heroStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface rounded-xl border border-outline-variant/30 p-md text-center"
              >
                <div className="font-display-lg text-4xl font-bold bg-gradient-to-br from-primary to-accent-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-sm font-label-md text-label-md text-on-surface font-semibold">
                  {stat.label}
                </div>
                <div className="mt-xs font-label-sm text-label-sm text-on-surface-variant">
                  {stat.sublabel}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section id="product" className="py-xl">
        <div className="max-w-[1280px] mx-auto px-lg lg:px-xl">
          <div className="text-center max-w-3xl mx-auto mb-xl">
            <span className="font-label-md text-label-md text-primary uppercase tracking-wider">
              The platform
            </span>
            <h2 className="mt-md font-headline-lg text-headline-lg text-on-surface leading-tight">
              Three intelligence layers.{' '}
              <span className="text-on-surface-variant">One calm dashboard.</span>
            </h2>
            <p className="mt-md font-body-lg text-body-lg text-on-surface-variant">
              GhostShift isn't a glorified spreadsheet. It's an operations co-pilot that sees
              patterns humans miss and acts on them in seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-lg">
            {featurePillars.map((pillar, i) => {
              const colorMap = {
                primary: 'from-primary/10 to-accent-600/5 text-primary border-primary/20',
                rose: 'from-rose-500/10 to-pink-500/5 text-rose-600 border-rose-500/20',
                emerald: 'from-sky-500/10 to-blue-500/5 text-sky-600 border-sky-500/20',
                amber: 'from-amber-500/10 to-orange-500/5 text-amber-600 border-amber-500/20',
              }
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorMap[pillar.color]} p-lg hover:shadow-soft-lg transition-shadow`}
                >
                  <div className="w-14 h-14 rounded-xl bg-surface/60 backdrop-blur flex items-center justify-center mb-md shadow-soft-sm">
                    <span className="material-symbols-outlined text-[28px]">{pillar.icon}</span>
                  </div>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">
                    {pillar.title}
                  </h3>
                  <p className="mt-sm font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {pillar.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-xl bg-surface-container-lowest/60 backdrop-blur-sm">
        <div className="max-w-[1280px] mx-auto px-lg lg:px-xl">
          <div className="text-center max-w-3xl mx-auto mb-xl">
            <span className="font-label-md text-label-md text-primary uppercase tracking-wider">
              How it works
            </span>
            <h2 className="mt-md font-headline-lg text-headline-lg text-on-surface leading-tight">
              From request to rest, in three minutes.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-lg relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary/40 via-primary/40 to-accent-600/40" />

            {[
              {
                step: '01',
                title: 'Request',
                desc: 'Staff mark shifts as swappable from mobile or desktop. The AI pre-screens peers by cert, preference, and current load.',
                icon: 'phone_iphone',
              },
              {
                step: '02',
                title: 'Match',
                desc: 'Google OR-Tools ranks candidates in milliseconds. The top peer gets a one-tap accept prompt.',
                icon: 'auto_awesome',
              },
              {
                step: '03',
                title: 'Confirm',
                desc: 'Manager approves (or auto-approves at high AI confidence). Burnout score updates in real time.',
                icon: 'check_circle',
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-surface rounded-2xl border border-outline-variant/30 p-lg shadow-soft-md"
              >
                <div className="absolute -top-4 left-6 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent-600 text-on-primary font-label-md text-label-sm font-bold">
                  {s.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mt-sm mb-md">
                  <span className="material-symbols-outlined text-[24px]">{s.icon}</span>
                </div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface">{s.title}</h3>
                <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-xl">
        <div className="max-w-[1280px] mx-auto px-lg lg:px-xl">
          <div className="text-center max-w-3xl mx-auto mb-xl">
            <span className="font-label-md text-label-md text-primary uppercase tracking-wider">
              From the floor
            </span>
            <h2 className="mt-md font-headline-lg text-headline-lg text-on-surface leading-tight">
              Loved by managers, trusted by staff.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-lg">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface rounded-2xl border border-outline-variant/30 p-lg shadow-soft-md flex flex-col"
              >
                <div className="flex gap-1 mb-md">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="material-symbols-outlined text-amber-400 text-[18px] fill">
                      star
                    </span>
                  ))}
                </div>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <div className="mt-lg flex items-center gap-sm pt-md border-t border-outline-variant/30">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-label-md text-label-md text-on-surface font-bold">
                      {t.author}
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      {t.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-xl bg-gradient-to-br from-primary/[0.04] via-primary/[0.04] to-accent-600/[0.04]">
        <div className="max-w-[1280px] mx-auto px-lg lg:px-xl text-center">
          <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight max-w-2xl mx-auto">
            Pricing that scales with your team, not your stress.
          </h2>
          <p className="mt-md font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
            Start free for 14 days. No card required. Switch tiers anytime.
          </p>
          <div className="mt-xl flex flex-wrap items-center justify-center gap-md">
            <Link to="/pricing" className="btn-primary px-lg py-md">
              See pricing
            </Link>
            <Link to="/login" className="btn-secondary px-lg py-md">
              Talk to a human
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-xl">
        <div className="max-w-[1280px] mx-auto px-lg lg:px-xl">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-accent-600 p-xl text-on-primary shadow-soft-xl">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent-300/60 blur-3xl" />
            </div>
            <div className="relative grid md:grid-cols-2 gap-lg items-center">
              <div>
                <h2 className="font-headline-lg text-headline-lg leading-tight">
                  Ready to give your team their Sundays back?
                </h2>
                <p className="mt-md font-body-lg text-body-lg opacity-90">
                  Deploy GhostShift in under a day. Integrates with Workday, Kronos, UKG, and 12
                  more systems you already use.
                </p>
              </div>
              <div className="flex flex-wrap gap-md md:justify-end">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-sm rounded-xl bg-white text-primary font-label-md text-label-md px-lg py-md shadow-soft-md hover:shadow-soft-lg hover:scale-[1.02] transition-all"
                >
                  Start free trial
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-sm rounded-xl bg-white/10 backdrop-blur text-on-primary border border-white/30 font-label-md text-label-md px-lg py-md hover:bg-white/20 transition-colors"
                >
                  Schedule demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}