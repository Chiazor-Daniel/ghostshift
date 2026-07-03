import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { realAPI } from '../services/realAPI.js'
import { useUser } from '../layout/AppShell.jsx'

  const SUGGESTIONS = [
    'How many open shifts are there?',
    "What's my burnout risk?",
    'Show me pending swap requests',
    'Who is working with me today?',
    'How do I invite a new employee?',
    'Explain how AI matching works',
  ]

const STORE_KEY = 'gs_chat_session_id'

// Pull the persisted session_id out of localStorage (matching realAPI._getChatSessionId)
function getStoredSession() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORE_KEY)
}

function summariseToolCalls(tool_calls = []) {
  if (!tool_calls.length) return null
  const successes = tool_calls.filter(tc => tc.result && tc.result.ok !== false)
  const failures = tool_calls.length - successes.length
  // Lightweight human-readable summary: prefer the tool's `message` field if present.
  const messages = tool_calls
    .map(tc => tc.result && tc.result.message)
    .filter(Boolean)
  if (messages.length === 1) return `✓ ${messages[0]}`
  if (messages.length > 1) return `✓ ${messages.length} actions completed`
  if (failures) return `⚠ ${failures} action${failures > 1 ? 's' : ''} failed`
  return null
}

// Convert historical DB turns (mixed user/assistant/tool rows) into the
// flat {role, content} pairs the UI bubbles need. Tool turns are skipped
// (their effect is already in the assistant response text).
function turnsToMessages(turns = []) {
  const out = []
  // API returns ascending (oldest first) — keep order
  for (const t of turns) {
    if (t.role === 'user' && t.content) {
      out.push({ role: 'user', text: t.content })
    } else if (t.role === 'assistant' && t.content) {
      out.push({ role: 'assistant', text: t.content })
    }
  }
  return out
}

export default function ChatAssistant() {
  const { user } = useUser()
  const userId = user?.id
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm **Shift**, your AI scheduling assistant. Ask me about your schedule, open shifts, swaps, leave requests, or team data. I can also point you to the right page in the dashboard." },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const scrollRef = useRef(null)

  // Restore prior session on mount (and on user-change)
  useEffect(() => {
    if (!open || historyLoaded) return
    const sessionId = getStoredSession()
    if (!sessionId) { setHistoryLoaded(true); return }
    realAPI.aiHistory(sessionId, 50)
      .then(res => {
        const restored = turnsToMessages(res?.turns || [])
        if (restored.length) {
          // Replace the welcome message + prepend restored turns
          setMessages(prev => {
            const greeting = prev[0] // keep the greeting bubble
            return greeting ? [greeting, ...restored] : restored
          })
        }
      })
      .catch(() => {}) // ignore — fresh conversation will work anyway
      .finally(() => setHistoryLoaded(true))
  }, [open, historyLoaded])

  // Listen for sidebar button to open chat
  useEffect(() => {
    const handleOpenChat = () => setOpen(true)
    window.addEventListener('open-chat-assistant', handleOpenChat)
    return () => window.removeEventListener('open-chat-assistant', handleOpenChat)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typing])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg) return
    setMessages((prev) => [...prev, { role: 'user', text: msg }])
    setInput('')
    setTyping(true)

    try {
      const r = await realAPI.aiChat(msg, { source: 'chat' })
      const summary = summariseToolCalls(r.tool_calls || [])
      const assistantMsg = {
        role: 'assistant',
        text: r.response || '…',
        tool_summary: summary,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      console.warn('ChatAssistant aiChat failed:', err)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: "Sorry, I'm having trouble reaching the AI service right now. Please try again in a moment.",
      }])
    } finally {
      setTyping(false)
    }
  }

  function startNewConversation() {
    realAPI.newChatSession()
    setMessages([
      { role: 'assistant', text: "New conversation started. Ask me about your schedule, swaps, leaves, or where to find something in GhostShift." },
    ])
    setHistoryLoaded(true)
  }

  function renderText(text) {
    if (!text) return null
    const lines = String(text).split('\n')
    return lines.map((line, i) => (
      <span key={i}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-bold text-on-surface">{part}</strong> : part
        )}
        {i < lines.length - 1 && <br />}
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
                  <div className="font-label-sm text-label-sm opacity-80">AI · live data · memory on</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={startNewConversation}
                  title="Start a new conversation"
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add_comment</span>
                </button>
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
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
                    {m.tool_summary && (
                      <div className="mt-1.5 pt-1.5 border-t border-outline-variant/30 text-[11px] opacity-70">
                        {m.tool_summary}
                      </div>
                    )}
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
              {messages.length <= 1 && !typing && (
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
