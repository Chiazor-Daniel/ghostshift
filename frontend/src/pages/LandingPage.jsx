import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import MarketingNav from '../components/MarketingNav.jsx'
import MarketingFooter from '../components/MarketingFooter.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

function DashboardMock() {
  return (
    <div className="relative rounded-2xl border border-outline-variant/40 bg-surface shadow-soft-lg overflow-hidden">
      <div className="flex items-center gap-2 px-md py-sm border-b border-outline-variant/30 bg-surface-variant/40">
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/60" />
        <span className="ml-md font-label-sm text-label-sm text-on-surface-variant">
          ghostshift.app
        </span>
      </div>

      <div className="grid grid-cols-[160px_1fr]">
        <aside className="border-r border-outline-variant/30 p-sm space-y-xs bg-surface-variant/20">
          {['Rota', 'Swaps', 'Fatigue', 'Team'].map((item, i) => (
            <div
              key={item}
              className={`flex items-center gap-sm px-sm py-xs rounded-lg font-label-sm text-label-sm ${
                i === 0 ? 'bg-primary/10 text-on-surface' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {['calendar_month', 'swap_horiz', 'monitor_heart', 'group'][i]}
              </span>
              {item}
            </div>
          ))}
        </aside>

        <div className="p-md space-y-sm">
          <div className="grid grid-cols-3 gap-sm">
            {[
              { label: 'Coverage', value: '94%' },
              { label: 'Open swaps', value: '3' },
              { label: 'Fatigue', value: '2' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-outline-variant/30 p-sm bg-surface"
              >
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {s.label}
                </div>
                <div className="mt-xs font-headline-md text-base font-semibold text-on-surface">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-outline-variant/30 p-sm bg-surface">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }).map((_, i) => {
                const states = ['shift','shift','off','shift','shift','off','flag','shift','shift','off','shift','off','shift','shift','flag','off','shift','shift','off','shift','shift','off','shift','off','shift','shift','off','flag']
                const state = states[i]
                const bg =
                  state === 'shift'
                    ? 'bg-primary/70'
                    : state === 'off'
                    ? 'bg-surface-variant'
                    : 'bg-amber-500/70'
                return <div key={i} className={`aspect-square rounded ${bg}`} />
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SwapMock() {
  return (
    <div className="relative rounded-2xl border border-outline-variant/40 bg-surface shadow-soft-lg overflow-hidden">
      <div className="flex items-center gap-2 px-md py-sm border-b border-outline-variant/30 bg-surface-variant/40">
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/60" />
        <span className="ml-md font-label-sm text-label-sm text-on-surface-variant">
          Thu 19:00 — ICU
        </span>
      </div>

      <div className="p-md space-y-sm">
        {[
          { initials: 'JT', name: 'Jordan T.', match: '98%' },
          { initials: 'MK', name: 'Mira K.', match: '91%' },
          { initials: 'DA', name: 'Devon A.', match: '84%' },
        ].map((p, i) => (
          <div
            key={p.name}
            className={`flex items-center justify-between rounded-lg border border-outline-variant/30 p-sm ${
              i === 0 ? 'bg-primary/5' : 'bg-surface'
            }`}
          >
            <div className="flex items-center gap-sm">
              <div className="w-7 h-7 rounded-full bg-surface-variant flex items-center justify-center font-label-sm text-label-sm text-on-surface font-semibold">
                {p.initials}
              </div>
              <span className="font-label-md text-label-md text-on-surface font-medium">
                {p.name}
              </span>
            </div>
            <div className="flex items-center gap-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {p.match}
              </span>
              <button className="font-label-sm text-label-sm px-sm py-xs rounded-md bg-primary text-on-primary">
                Match
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FatigueMock() {
  return (
    <div className="relative rounded-2xl border border-outline-variant/40 bg-surface shadow-soft-lg overflow-hidden">
      <div className="flex items-center gap-2 px-md py-sm border-b border-outline-variant/30 bg-surface-variant/40">
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/60" />
        <span className="ml-md font-label-sm text-label-sm text-on-surface-variant">
          Team fatigue
        </span>
      </div>

      <div className="p-md space-y-sm">
        {[
          { name: 'Anaïs K.', pct: 88 },
          { name: 'Devon A.', pct: 73 },
          { name: 'Jordan T.', pct: 64 },
          { name: 'Mira K.', pct: 41 },
        ].map((p) => {
          const tone = p.pct >= 70 ? 'bg-amber-500' : p.pct >= 50 ? 'bg-amber-500/50' : 'bg-primary/70'
          return (
            <div key={p.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-md text-label-md text-on-surface">
                  {p.name}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {p.pct}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-variant overflow-hidden">
                <div className={`h-full ${tone}`} style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <MarketingNav />

      {/* HERO */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=2400&q=80"
          alt="Healthcare team during a shift"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative px-lg lg:px-xl py-28 lg:py-40">
          <div className="max-w-3xl text-white">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-label-md text-label-md uppercase tracking-[0.18em] text-white/70"
            >
              Shift intelligence for healthcare teams
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mt-md font-display-lg text-display-lg leading-[1.05] tracking-tight"
            >
              A calmer rota starts before the sick day.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-lg font-body-lg text-body-lg text-white/85 max-w-xl"
            >
              Swap shifts in seconds. See who's stretched thin. Let the system flag fatigue before your team has to.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-xl flex items-center gap-md"
            >
              <Link to="/signup" className="btn-primary px-lg py-md text-base">
                Get started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-lg py-md text-base rounded-lg border border-white/40 text-white hover:bg-white/10 transition-colors"
              >
                Sign in
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* THE PRODUCT */}
      <section id="product" className="px-lg lg:px-xl py-2xl scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-xl items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                The product
              </p>
              <h2 className="mt-sm font-headline-lg text-headline-lg text-on-surface leading-tight">
                Everything that runs the rota, in one place.
              </h2>
              <p className="mt-md font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-md">
                Rota, swaps, and fatigue flags — together, updating together.
              </p>

              <ul className="mt-lg space-y-md">
                {[
                  { icon: 'swap_horiz', text: 'Post a shift, match a peer, approve. Done in under a minute.' },
                  { icon: 'monitor_heart', text: 'Fatigue scores that move when the rota moves.' },
                ].map((item) => (
                  <li key={item.icon} className="flex gap-md items-start">
                    <span className="shrink-0 w-9 h-9 rounded-lg bg-surface-variant/60 flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface text-[18px]">
                        {item.icon}
                      </span>
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant leading-relaxed pt-1">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <DashboardMock />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURE PAIR — swaps + fatigue */}
      <section className="px-lg lg:px-xl py-xl lg:py-2xl bg-surface/40 border-y border-outline-variant/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="max-w-2xl mb-xl"
          >
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              What's inside
            </p>
            <h2 className="mt-sm font-headline-lg text-headline-lg text-on-surface leading-tight">
              Two jobs nobody should do by hand.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-md">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="rounded-2xl bg-surface border border-outline-variant/40 overflow-hidden flex flex-col"
            >
              <div className="px-lg pt-lg">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Swaps
                  </span>
                  <span className="material-symbols-outlined text-on-surface text-[20px]">
                    swap_horiz
                  </span>
                </div>
                <h3 className="mt-sm font-headline-md text-xl font-semibold text-on-surface leading-snug">
                  Match a shift in under a minute.
                </h3>
                <p className="mt-sm font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Ranked by availability, qualifications, and recent load. Approve one — both calendars update.
                </p>
              </div>
              <div className="mt-md p-md">
                <SwapMock />
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl bg-surface border border-outline-variant/40 overflow-hidden flex flex-col"
            >
              <div className="px-lg pt-lg">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Fatigue
                  </span>
                  <span className="material-symbols-outlined text-on-surface text-[20px]">
                    monitor_heart
                  </span>
                </div>
                <h3 className="mt-sm font-headline-md text-xl font-semibold text-on-surface leading-snug">
                  Catch burnout before it costs you a shift.
                </h3>
                <p className="mt-sm font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Hours, rest gaps and intensity — rolled up live, not at month-end.
                </p>
              </div>
              <div className="mt-md p-md">
                <FatigueMock />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-lg lg:px-xl py-xl lg:py-2xl scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="max-w-2xl mb-xl"
          >
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              How it works
            </p>
            <h2 className="mt-sm font-headline-lg text-headline-lg text-on-surface leading-tight">
              Posted → matched → covered.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-md">
            {[
              { step: '01', title: 'Post' },
              { step: '02', title: 'Match' },
              { step: '03', title: 'Approve' },
              { step: '04', title: 'Watch' },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="relative p-lg rounded-2xl bg-surface border border-outline-variant/40"
              >
                <div className="font-label-md text-label-md text-on-surface-variant">
                  {s.step}
                </div>
                <h3 className="mt-sm font-headline-md text-xl font-semibold text-on-surface">
                  {s.title}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="px-lg lg:px-xl py-xl lg:py-2xl bg-surface/40 border-y border-outline-variant/30 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-md"
          >
            {[
              {
                quote: '"We used to lose an hour a day to group chats. Now I post a shift and it\'s covered before I finish my coffee."',
                name: 'Hannah O.',
                role: 'Charge Nurse, ICU',
              },
              {
                quote: '"The fatigue flag caught a stretch one of my team was about to burn out on. That alone paid for the rollout."',
                name: 'Dr. Rehan S.',
                role: 'Clinical Lead, Northcare',
              },
            ].map((t) => (
              <motion.figure
                key={t.name}
                variants={fadeUp}
                className="rounded-2xl bg-surface border border-outline-variant/40 p-lg flex flex-col"
              >
                <blockquote className="font-body-md text-body-md text-on-surface leading-relaxed">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-lg pt-lg border-t border-outline-variant/30">
                  <div className="font-label-md text-label-md text-on-surface font-medium">
                    {t.name}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    {t.role}
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="px-lg lg:px-xl py-xl">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Integrations
            </p>
            <h2 className="mt-sm font-headline-lg text-headline-lg text-on-surface leading-tight">
              Works with what you already run.
            </h2>
            <p className="mt-md font-body-md text-body-md text-on-surface-variant leading-relaxed">
              HR systems, payroll, calendars, NHSmail, SSO. No new login.
            </p>
            <div className="mt-lg flex flex-wrap items-center justify-center gap-sm">
              {['HR systems', 'Payroll', 'Calendars', 'SSO', 'NHSmail', 'Mail'].map((tag) => (
                <span
                  key={tag}
                  className="px-sm py-xs rounded-full bg-surface-variant/60 font-label-sm text-label-sm text-on-surface-variant"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-lg lg:px-xl py-xl lg:py-2xl border-t border-outline-variant/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mb-xl"
          >
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              FAQ
            </p>
            <h2 className="mt-sm font-headline-lg text-headline-lg text-on-surface leading-tight">
              Quick answers.
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-sm"
          >
            {[
              {
                q: 'How long does setup take?',
                a: 'Most teams are live within a working day.',
              },
              {
                q: 'Does it work with our existing rota system?',
                a: 'Yes. We import your current schedule and post swaps back to it.',
              },
              {
                q: 'What does it cost?',
                a: 'Free for your first team during early access. Paid tiers are per clinician and start below the cost of one unfilled shift.',
              },
            ].map((item) => (
              <motion.details
                key={item.q}
                variants={fadeUp}
                className="group rounded-2xl bg-surface border border-outline-variant/40 p-lg"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-headline-md text-lg font-semibold text-on-surface pr-md">
                    {item.q}
                  </span>
                  <span className="material-symbols-outlined text-on-surface transition-transform group-open:rotate-45">
                    add
                  </span>
                </summary>
                <p className="mt-md font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {item.a}
                </p>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-lg lg:px-xl py-xl lg:py-2xl">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-surface border border-outline-variant/40 px-lg py-2xl text-center shadow-soft-lg"
          >
            <h2 className="font-display-md text-display-md text-on-surface leading-[1.1]">
              Spin up GhostShift in minutes.
            </h2>
            <p className="mt-md font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
              Free for your first team. No credit card.
            </p>
            <div className="mt-xl flex items-center justify-center gap-md">
              <Link to="/signup" className="btn-primary px-lg py-md text-base">
                Get started
              </Link>
              <Link to="/login" className="btn-secondary px-lg py-md text-base">
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}