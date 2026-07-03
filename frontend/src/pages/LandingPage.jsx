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
          {['Rota', 'Swaps', 'Insights', 'Team'].map((item, i) => (
            <div
              key={item}
              className={`flex items-center gap-sm px-sm py-xs rounded-lg font-label-sm text-label-sm ${
                i === 0 ? 'bg-primary/10 text-on-surface' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {['calendar_month', 'swap_horiz', 'auto_awesome', 'group'][i]}
              </span>
              {item}
            </div>
          ))}
        </aside>

        <div className="p-md space-y-sm">
          <div className="grid grid-cols-3 gap-sm">
            {[
              { label: 'Coverage', value: '94%' },
              { label: 'Open shifts', value: '12' },
              { label: 'At risk', value: '2' },
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
          Thu 19:00 — Night shift
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
          Team workload
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
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2400&q=80"
          alt="Team collaborating on scheduling"
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
              Shift intelligence for modern teams
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mt-md font-display-lg text-display-lg leading-[1.05] tracking-tight"
            >
              Stop chasing coverage. Start predicting it.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-lg font-body-lg text-body-lg text-white/85 max-w-xl"
            >
              GhostShift fills open shifts in seconds, matches swaps instantly, and flags burnout before it costs you a person — all powered by AI.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-xl flex items-center gap-md"
            >
              <Link to="/signup" className="btn-primary px-lg py-md text-base">
                Get started free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-lg py-md text-base rounded-lg border border-white/40 text-white hover:bg-white/10 transition-colors"
              >
                Sign in
              </Link>
            </motion.div>
            <p className="mt-md font-label-sm text-label-sm text-white/60">
              No credit card · Live in a day · Works for any shift-based team
            </p>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="px-lg lg:px-xl py-lg border-b border-outline-variant/20 bg-surface/60">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-md text-center"
          >
            {[
              { value: '200+', label: 'Shift-based teams' },
              { value: '98%', label: 'Shift fill rate' },
              { value: '<1s', label: 'Swap match time' },
              { value: '2-3 wk', label: 'Early burnout detection' },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display-md text-display-md font-bold text-primary">{s.value}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
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
                The platform
              </p>
              <h2 className="mt-sm font-headline-lg text-headline-lg text-on-surface leading-tight">
                Everything that runs your rota, in one place.
              </h2>
              <p className="mt-md font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-md">
                Shifts, swaps, and burnout insights — together, updating in real time.
              </p>

              <ul className="mt-lg space-y-md">
                {[
                  { icon: 'swap_horiz', text: 'Post a shift, match a peer, approve. Done in under a minute.' },
                  { icon: 'monitor_heart', text: 'Workload scores that update the moment the rota changes.' },
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

      {/* FEATURE PAIR — swaps + workload */}
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
                    Workload
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


      {/* AI FEATURES — THE DIFFERENTIATOR */}
      <section id="ai-features" className="px-lg lg:px-xl py-xl lg:py-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-surface border-y border-outline-variant/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-md">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="font-label-md text-label-md font-bold">AI-Powered Intelligence</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight">
              The only scheduling platform with built-in AI that actually works.
            </h2>
            <p className="mt-md font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              GhostShift's AI doesn't just suggest — it acts. Real-time matching, predictive burnout detection, and a conversational assistant that knows your team.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-lg">
            {[
              {
                icon: 'smart_toy',
                title: 'AI Assistant',
                desc: 'Ask questions in plain English. "Who can cover Tuesday night?" "Show me burnout risks." Get instant answers with live data.',
                highlight: 'Always available in sidebar',
                color: 'primary',
              },
              {
                icon: 'psychology',
                title: 'Smart Swap Matching',
                desc: 'Every swap request gets a real AI score (0-100%) based on department, certifications, workload, and availability. No more guessing.',
                highlight: 'Calculated in <1 second',
                color: 'accent',
              },
              {
                icon: 'monitor_heart',
                title: 'Burnout Prediction',
                desc: 'Machine learning model predicts burnout 2-3 weeks early. See who\'s at risk before it becomes a problem.',
                highlight: 'LightGBM model, 89% accuracy',
                color: 'success',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-lg rounded-2xl bg-surface border border-outline-variant/40 hover:shadow-soft-lg transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl bg-${feature.color}/10 text-${feature.color} flex items-center justify-center mb-md group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-[28px]">{feature.icon}</span>
                </div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface mb-sm">
                  {feature.title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-md">
                  {feature.desc}
                </p>
                <div className="pt-md border-t border-outline-variant/30">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {feature.highlight}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-xl text-center"
          >
            <Link to="/signup" className="btn-primary px-xl py-md text-base inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              Try the AI features free
            </Link>
            <p className="mt-md font-label-sm text-label-sm text-on-surface-variant">
              No credit card required · See AI in action from day one
            </p>
          </motion.div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="px-lg lg:px-xl py-xl bg-surface/40 border-y border-outline-variant/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-xl"
          >
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Built for any shift-based team
            </p>
            <h2 className="mt-sm font-headline-lg text-headline-lg text-on-surface leading-tight">
              Wherever coverage matters, GhostShift fits.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {[
              { icon: 'medical_services', title: 'Healthcare', desc: 'Clinics, care teams, and on-site providers running 24/7 rotas.' },
              { icon: 'analytics', title: 'Analytics & Operations', desc: 'SOC teams, support desks, and field ops on rotating shifts.' },
              { icon: 'security', title: 'Security & Frontline', desc: 'Guards, dispatchers, and on-call engineers who never clock out.' },
              { icon: 'restaurant', title: 'Hospitality', desc: 'Hotels, restaurants, and venues juggling peak-time staffing.' },
              { icon: 'factory', title: 'Manufacturing', desc: 'Plant shifts, lines, and skilled-trade coverage.' },
              { icon: 'school', title: 'Education', desc: 'Substitute teachers, campus teams, after-school programs.' },
            ].map((u, i) => (
              <motion.div
                key={u.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="p-lg rounded-2xl bg-surface border border-outline-variant/40"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-sm">
                  <span className="material-symbols-outlined text-[22px]">{u.icon}</span>
                </div>
                <h3 className="font-headline-md text-lg font-semibold text-on-surface">{u.title}</h3>
                <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{u.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-lg lg:px-xl py-xl lg:py-2xl">
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
                a: 'Most teams are live within a working day. Import your rota, invite your team, and you\'re running.',
              },
              {
                q: 'Does it work with our existing scheduling system?',
                a: 'Yes. We import your current schedule and post swaps back to it. No rip-and-replace.',
              },
              {
                q: 'Do my employees need training?',
                a: 'No. If they can use a calendar app, they can use GhostShift. The AI does the heavy lifting in the background.',
              },
              {
                q: 'What does it cost?',
                a: 'Free for your first team during early access. Paid tiers are per user and start below the cost of one unfilled shift.',
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



      <MarketingFooter />
    </div>
  )
}
