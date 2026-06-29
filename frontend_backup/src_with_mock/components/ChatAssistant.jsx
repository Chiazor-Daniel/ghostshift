import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getShifts, getSwaps, getEmployees, computeBurnout, getOpenShifts, findCandidates, addSwap, getEmployee } from '../data/store.js'
import { useUser } from '../layout/AppShell.jsx'

const SUGGESTIONS = [
  'How many open shifts are there?',
  'What is my burnout risk?',
  'Show me pending swap requests',
  'How do I request time off?',
  'Who is working with me today?',
  'Draft a swap request for my next shift',
  'Explain how AI matching works',
]

function generateResponse(query, userId) {
  const q = query.toLowerCase()
  const openShifts = getOpenShifts()
  const swaps = getSwaps()
  const employees = getEmployees()
  const pendingSwaps = swaps.filter(s => s.status === 'pending')

  if (q.includes('open shift') || q.includes('unfilled')) {
    return `There are currently **${openShifts.length} open shifts** across ${[...new Set(openShifts.map(s => s.department))].length} departments. ${openShifts.filter(s => s.urgency === 'high').length} are marked as high urgency.`
  }

  if (q.includes('burnout') || q.includes('risk') || q.includes('fatigue')) {
    const allBurnout = employees.map(e => ({ ...e, ...computeBurnout(e.id) }))
    const avg = allBurnout.length ? Math.round(allBurnout.reduce((s, e) => s + e.score, 0) / allBurnout.length) : 0
    const highRisk = allBurnout.filter(e => e.score >= 70).length
    return `Team burnout index is **${avg}/100**. ${highRisk} employee${highRisk === 1 ? '' : 's'} are at high risk (score ≥70). Check the Health Analytics page for detailed insights.`
  }

  if (q.includes('swap') || q.includes('pending')) {
    return `There are **${pendingSwaps.length} pending swap requests** awaiting review. ${pendingSwaps.filter(s => s.aiScore >= 85).length} can be auto-approved based on AI match score ≥85%.`
  }

  if (q.includes('time off') || q.includes('leave') || q.includes('pto') || q.includes('vacation')) {
    return `You can request time off from the **Leave Requests** page in the sidebar. Select your leave type, dates, and reason. Your manager will be notified for approval.`
  }

  if (q.includes('working') || q.includes('colleague') || q.includes('team today')) {
    const today = new Date().toISOString().slice(0, 10)
    const todayShifts = getShifts().filter(s => s.date === today || (typeof s.date === 'string' && s.date.startsWith(today)))
    return `There are **${todayShifts.length} shifts scheduled for today** across ${[...new Set(todayShifts.map(s => s.department))].length} departments.`
  }

  if (q.includes('draft') && (q.includes('swap') || q.includes('request'))) {
    if (!userId) return `I need to know who you are to draft a swap. Please log in first.`
    const myShifts = getShifts().filter(s => s.employeeId === userId && s.status !== 'completed' && s.status !== 'open')
    if (myShifts.length === 0) return `You don't have any upcoming shifts to swap. Browse the Marketplace to pick up a new shift instead.`
    const nextShift = myShifts.sort((a, b) => new Date(a.date) - new Date(b.date))[0]
    const candidates = findCandidates(nextShift.id, 3)
    if (candidates.length === 0) return `I couldn't find any eligible candidates for your ${nextShift.title || nextShift.role} shift on ${new Date(nextShift.date).toLocaleDateString()}.`
    const topCandidate = candidates[0]
    addSwap({
      requesterId: userId,
      requesterName: getEmployee(userId)?.name || 'You',
      fromShiftId: nextShift.id,
      targetId: topCandidate.id,
      targetName: topCandidate.name,
      reason: 'Drafted by Shift assistant',
    })
    return `Done! I drafted a swap request for your **${nextShift.title || nextShift.role}** shift on ${new Date(nextShift.date).toLocaleDateString()}.\n\nTop candidate: **${topCandidate.name}** (${topCandidate.score}% match)\n\nCheck the Swap Requests page to review and submit it.`
  }

  if (q.includes('explain') && (q.includes('ai') || q.includes('match') || q.includes('score') || q.includes('how'))) {
    return `**How AI matching works:**\n\nWhen a shift needs coverage, the system scores every eligible employee 0–100 based on:\n\n• **Department match** — same department = no penalty\n• **Certifications** — missing required certs = -10 per cert\n• **Burnout risk** — score >70 = -20, >50 = -10\n• **Consecutive days** — ≥4 days = -15\n• **Weekly hours** — >90% of max = -20\n• **Night shift load** — ≥3 night shifts + this is night = -10\n• **Availability** — unavailable slot = -30, preferred = +5\n• **Fairness** — disproportionate weekend/night shifts = -8\n• **Seniority** — 1+ year tenure = +1, 2+ years = +3\n\nScores ≥85% can be auto-approved. Below that requires manager review.`
  }

  if (q.includes('fairness') || q.includes('equal') || q.includes('distribut')) {
    return `**Fairness Analytics** tracks how evenly shifts are distributed:\n\n• Weekend shift counts per employee\n• Night shift counts per employee\n• Total hours and overtime per employee\n\nThe fairness score (0–100) is based on variance across all metrics. A low score means some employees are disproportionately overloaded. Check the Health Analytics page for the full breakdown.`
  }

  if (q.includes('cert') || q.includes('expir') || q.includes('renewal')) {
    return `Certification expiry alerts appear on your Dashboard (admin) or My Portal (employee) when a cert is within 90 days of expiring. Severity levels:\n\n• **Critical** — ≤14 days\n• **High** — ≤30 days\n• **Medium** — ≤90 days\n\nContact your admin to schedule recertification.`
  }

  if (q.includes('schedule') || q.includes('shift')) {
    return `You can view your schedule in **My Portal** (employees) or the **Dashboard** (admins). The calendar shows all your shifts, and you can click any shift for details.`
  }

  if (q.includes('marketplace') || q.includes('browse')) {
    return `The **Shift Marketplace** shows all open shifts available for pickup. You can filter by department, urgency, and eligibility. Click any shift to request it.`
  }

  if (q.includes('availability') || q.includes('prefer')) {
    return `Set your availability preferences in the **Availability** page. Tap cells in the weekly template to cycle between Preferred, Available, and Unavailable. The AI uses this when matching shifts.`
  }

  if (q.includes('help') || q.includes('what can')) {
    return `I can help you with:\n• Checking open shifts and swap requests\n• Understanding burnout risk\n• Drafting swap requests for your shifts\n• Explaining how AI matching works\n• Navigating the app (schedule, marketplace, availability)\n• Requesting time off\n• Finding colleagues on shift\n• Fairness and certification info\n\nJust ask in plain English!`
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return `Hi! I'm Shift, your scheduling assistant. Ask me anything about your shifts, team, or burnout risk. Try: "How many open shifts are there?" or "Draft a swap request for my next shift"`
  }

  return `I'm not sure about that yet. Try asking about:\n• Open shifts or swap requests\n• Burnout risk for your team\n• Drafting a swap request\n• How AI matching works\n• Your schedule or availability\n\nI'm a mock assistant for now — real AI coming with the backend!`
}

export default function ChatAssistant() {
  const { user } = useUser()
  const userId = user?.id
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm **Shift**, your scheduling assistant. Ask me anything about shifts, swaps, or burnout risk." },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typing])

  function send(text) {
    const msg = text || input
    if (!msg.trim()) return
    setMessages((prev) => [...prev, { role: 'user', text: msg }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const response = generateResponse(msg, userId)
      setMessages((prev) => [...prev, { role: 'assistant', text: response }])
      setTyping(false)
    }, 600 + Math.random() * 400)
  }

  function renderText(text) {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-bold text-on-surface">{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 md:right-6 z-[90] w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh] rounded-2xl shadow-soft-xl bg-surface border border-outline-variant/30 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30 bg-primary text-on-primary">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
                <div>
                  <div className="font-label-md text-label-md font-bold">Shift Assistant</div>
                  <div className="font-label-sm text-label-sm opacity-80">AI scheduling helper</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-on-primary rounded-br-sm'
                      : 'bg-surface-variant text-on-surface rounded-bl-sm'
                  }`}>
                    {renderText(m.text)}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-surface-variant px-3 py-2 rounded-xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              {messages.length <= 1 && (
                <div className="space-y-2 pt-2">
                  <div className="font-label-sm text-label-sm text-on-surface-variant">Try asking:</div>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full text-left px-3 py-2 rounded-lg bg-surface-variant/50 hover:bg-surface-variant text-sm text-on-surface transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-outline-variant/30">
              <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about shifts, swaps, burnout..."
                  className="input-base flex-1 text-sm"
                  autoFocus
                />
                <button type="submit" disabled={!input.trim()} className="btn-primary py-2 px-3 disabled:opacity-40">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-4 right-4 md:right-6 z-[90] w-14 h-14 rounded-full shadow-soft-xl flex items-center justify-center transition-colors ${
          open ? 'bg-surface-variant text-on-surface-variant' : 'bg-primary text-on-primary'
        }`}
        aria-label="Toggle chat assistant"
      >
        <span className="material-symbols-outlined text-[28px]">{open ? 'close' : 'smart_toy'}</span>
      </motion.button>
    </>
  )
}
