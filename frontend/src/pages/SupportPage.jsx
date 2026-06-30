import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

import { Card, CardHeader, Badge } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'

const faqs = [
  { q: 'How does AI swap matching work?', a: 'Our matching engine uses OR-Tools constraint programming. It considers 14 factors including certifications, rest gaps, consecutive hours, and peer compatibility to find the optimal peer for your shift in <1 second.' },
  { q: 'What happens to my data if I cancel?', a: 'You can export all data in standard formats (CSV, JSON, iCal) at any time. After cancellation, we retain data for 30 days for recovery, then permanently delete it within 90 days.' },
  { q: 'Is GhostShift HIPAA compliant?', a: 'Yes. We sign a BAA with every customer, encrypt all PHI at rest and in transit (AES-256, TLS 1.3), and maintain SOC 2 Type II certification.' },
  { q: 'Can I customize the burnout model?', a: 'HR admins and above can tune feature weights in the AI Engine section. Changes are deployed via a 24h A/B test to ensure they don\'t regress accuracy.' },
  { q: 'How does the assistant work?', a: 'Our assistant uses GPT-4o with retrieval-augmented generation (RAG) over your org\'s policies, scheduling rules, and shift data. It can take 12 actions via tools: post a shift, request a swap, check eligibility, etc.' },
  { q: 'What integrations do you support?', a: 'Workday, Kronos/UKG, ADP, BambooHR, Microsoft Entra SSO, Slack, PagerDuty, Google Calendar, Epic, Twilio, and more. See Integrations in Admin.' },
]

const tickets = [
  { id: 'TKT-2847', subject: 'Slack notifications not firing for PTO approvals', status: 'open', priority: 'medium', updated: '2h ago' },
  { id: 'TKT-2846', subject: 'Request: add custom field to shift metadata', status: 'in_progress', priority: 'low', updated: '1d ago' },
  { id: 'TKT-2841', subject: 'Burnout model retraining failed on Jun 22', status: 'resolved', priority: 'high', updated: '5d ago' },
]

export default function SupportPage() {
  const [search, setSearch] = useState('')
  const toast = useToast()

  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', body: "Hi! I'm the GhostShift assistant. Ask me anything about your shifts, swap policies, or burnout insights." },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chatMessages, chatOpen])

  async function sendMessage(e) {
    e?.preventDefault?.()
    const text = chatInput.trim()
    if (!text || chatBusy) return
    const userMsg = { role: 'user', body: text }
    setChatMessages((m) => [...m, userMsg])
    setChatInput('')
    setChatBusy(true)
    try {
      const res = await realAPI.aiChat(text, { source: 'support' })
      const reply = res?.reply || res?.response || res?.message || res?.text || 'I could not generate a reply right now.'
      setChatMessages((m) => [...m, { role: 'assistant', body: typeof reply === 'string' ? reply : JSON.stringify(reply) }])
    } catch (err) {
      setChatMessages((m) => [...m, { role: 'assistant', body: `Sorry — ${err.message || 'I could not reach the AI service.'}` }])
    } finally {
      setChatBusy(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">Help & Support</h1>
      </div>
      <section className="page-section">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent-600 text-on-primary p-6 md:p-xl">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-2xl mx-auto text-center">
            <h1 className="font-display-md md:font-display-lg text-3xl md:text-display-lg font-bold leading-tight">
              How can we help?
            </h1>
            <p className="font-body-md text-body-md opacity-90 mt-sm">
              Search docs, ask our assistant, or open a ticket — usually resolved in &lt; 2 hours.
            </p>
            <div className="mt-6 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-primary/70">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles, guides, troubleshooting..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-on-primary placeholder:text-on-primary/70 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-1 justify-center">
              {['Burnout model', 'Slack integration', 'Export data', 'SSO setup'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSearch(t)}
                  className="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-on-primary font-label-sm text-label-sm hover:bg-white/25 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-6">
            <section>
              <h2 className="font-headline-md text-lg md:text-headline-lg text-on-surface font-bold mb-4">
                Quick start guides
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Setting up your team', desc: 'Import staff, departments, and policies', icon: 'group_add', color: 'primary' },
                  { title: 'Connecting your EHR', desc: 'Sync patient acuity from Epic or Cerner', icon: 'medical_services', color: 'success' },
                  { title: 'Configuring burnout model', desc: 'Tune feature weights for your specialty', icon: 'tune', color: 'warning' },
                  { title: 'Building custom reports', desc: 'Use the analytics API & exports', icon: 'analytics', color: 'info' },
                ].map((g) => (
                  <Card
                    key={g.title}
                    hover
                    className="cursor-pointer"
                  >
                    <button
                      onClick={() => toast.push(`Opening “${g.title}” guide…`, { tone: 'info' })}
                      className="text-left w-full"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            g.color === 'primary'
                              ? 'bg-primary/10 text-primary'
                              : g.color === 'success'
                                ? 'bg-success/10 text-success'
                                : g.color === 'warning'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-info/10 text-info'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[24px]">{g.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-label-md text-label-md font-bold text-on-surface">{g.title}</h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{g.desc}</p>
                        </div>
                      </div>
                    </button>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-headline-md text-lg md:text-headline-lg text-on-surface font-bold mb-4">
                Frequently asked
              </h2>
              <div className="space-y-2">
                {faqs.map((f, i) => (
                  <details
                    key={i}
                    className="bg-surface rounded-xl border border-outline-variant/30 p-4 open:shadow-soft-sm transition-shadow"
                  >
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <span className="font-label-md text-label-md text-on-surface font-bold pr-4">{f.q}</span>
                      <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">
                        expand_more
                      </span>
                    </summary>
                    <p className="mt-4 font-body-md text-body-md text-on-surface-variant leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-4">
            <Card hover={false}>
              <CardHeader icon="forum" title="Your tickets" />
              <div className="mt-4 space-y-sm">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toast.push(`Ticket ${t.id} detail arrives with the backend release`, { tone: 'info' })}
                    className="w-full text-left p-3 rounded-lg border border-outline-variant/30 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-sm mb-1">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{t.id}</span>
                      <Badge
                        variant={
                          t.status === 'open'
                            ? 'warning'
                            : t.status === 'in_progress'
                              ? 'info'
                              : 'success'
                        }
                      >
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="font-label-md text-label-md text-on-surface font-medium leading-snug">
                      {t.subject}
                    </p>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 block">
                      Updated {t.updated}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <Card hover={false}>
              <div className="flex items-center gap-sm mb-4">
                <span className="material-symbols-outlined text-primary text-[24px]">support_agent</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Talk to a human</h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                Enterprise customers get a dedicated CSM and 24/7 priority support.
              </p>
              <div className="space-y-sm">
                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => setChatOpen(true)}
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Start live chat
                </button>
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => toast.push('Opening your email client…', { tone: 'info' })}
                >
                  <span className="material-symbols-outlined text-[18px]">email</span>
                  Email support
                </button>
              </div>
            </Card>

            <Card hover={false}>
              <CardHeader icon="schedule" title="System status" />
              <div className="mt-4 space-y-2">
                {[
                  ['AI matching engine', 'Operational', 'success'],
                  ['Burnout prediction', 'Operational', 'success'],
                  ['Assistant', 'Operational', 'success'],
                  ['Slack integration', 'Degraded', 'warning'],
                  ['Mobile push', 'Operational', 'success'],
                ].map(([s, status, color]) => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface">{s}</span>
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          color === 'success'
                            ? 'bg-success animate-pulse'
                            : 'bg-warning animate-pulse'
                        }`}
                      />
                      <span
                        className={`font-label-sm text-label-sm ${
                          color === 'success' ? 'text-success' : 'text-warning'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </section>

      {chatOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 z-[110] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6"
          onClick={() => setChatOpen(false)}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-t-2xl sm:rounded-2xl shadow-soft-xl w-full sm:w-[420px] h-[80vh] sm:h-[600px] flex flex-col"
          >
            <div className="flex items-center justify-between p-md border-b border-outline-variant/30">
              <div className="flex items-center gap-sm">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
                <div>
                  <div className="font-label-md text-label-md font-bold text-on-surface">GhostShift assistant</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">Powered by your org's data</div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div ref={chatRef} className="flex-1 overflow-y-auto p-md space-y-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    m.role === 'user'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-variant text-on-surface'
                  }`}>
                    <p className="font-body-sm text-body-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  </div>
                </div>
              ))}
              {chatBusy && (
                <div className="flex justify-start">
                  <div className="bg-surface-variant text-on-surface-variant rounded-2xl px-3 py-2">
                    <span className="font-body-sm text-body-sm">typing…</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="p-md border-t border-outline-variant/30 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about shifts, swaps, burnout…"
                className="input-base flex-1"
                disabled={chatBusy}
              />
              <button type="submit" disabled={chatBusy || !chatInput.trim()} className="btn-primary disabled:opacity-40">
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}