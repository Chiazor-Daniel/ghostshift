import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { Select, PasswordInput } from '../components/ui.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { roleHome } from '../data/roles.js'
import { realAPI } from '../services/realAPI.js'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1639489547592-8aa4475ff677?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

const steps = [
  { id: 'org', label: 'Organization' },
  { id: 'admin', label: 'Admin' },
  { id: 'departments', label: 'Departments' },
  { id: 'team', label: 'Team' },
  { id: 'review', label: 'Review' },
]

const orgTypes = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'analytics', label: 'Analytics / Operations' },
  { value: 'security', label: 'Security / Frontline' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
]

const sizeOptions = [
  { value: '1-50', label: '1–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '501-2000', label: '501–2,000 employees' },
  { value: '2000+', label: '2,000+ employees' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const [deptInput, setDeptInput] = useState('')

  const [data, setData] = useState({
    orgName: '',
    orgType: '',
    orgTypeCustom: '',
    orgSize: '',
    location: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    departments: [],
    staffPerDept: '',
    shiftPattern: '',
  })

  const update = (k, v) => setData((d) => ({ ...d, [k]: v }))

  const next = () => {
    if (step === 2 && deptInput.trim()) {
      const trimmed = deptInput.trim()
      if (!data.departments.includes(trimmed)) {
        update('departments', [...data.departments, trimmed])
      }
      setDeptInput('')
    }
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }
  const prev = () => setStep((s) => Math.max(s - 1, 0))

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const { signup } = useAuth()

  async function complete() {
    setSubmitError('')
    setSubmitting(true)
    try {
      const result = await signup({
        org_name: data.orgName,
        org_type: data.orgType === 'other' ? data.orgTypeCustom : data.orgType,
        org_size: data.orgSize,
        location: data.location,
        departments: data.departments,
        admin_name: data.adminName,
        admin_email: data.adminEmail,
        admin_password: data.adminPassword,
      })
      navigate(roleHome(result.user.role), { replace: true })
    } catch (err) {
      setSubmitError(err.message || 'Could not create organization')
    } finally {
      setSubmitting(false)
    }
  }

  const canNext = () => {
    switch (steps[step].id) {
      case 'org':
        if (!data.orgName || !data.orgType || !data.orgSize) return false
        if (data.orgType === 'other' && !data.orgTypeCustom.trim()) return false
        return true
      case 'admin': return data.adminName && data.adminEmail && data.adminPassword
      case 'departments': return data.departments.length > 0 || deptInput.trim() !== ''
      case 'team': return data.staffPerDept && data.shiftPattern
      default: return true
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* Left — form */}
      <div className="flex items-center justify-center p-md sm:p-xl lg:p-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[500px]"
        >
          <Link to="/" className="flex items-center gap-sm mb-xl md:hidden">
            <Logo size={32} />
            <span className="font-headline-md text-xl font-bold text-on-surface">GhostShift</span>
          </Link>

          <Link to="/login" className="font-label-sm text-label-sm text-primary hover:underline mb-lg block">
            &larr; Back to sign in
          </Link>

          {/* Steps bar */}
          <div className="flex items-center gap-2 mb-xl">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                  i <= step ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'
                }`}>
                  {i < step ? <span className="material-symbols-outlined text-[14px]">check</span> : i + 1}
                </div>
                <span className={`font-label-sm text-[11px] hidden sm:block ${i <= step ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary' : 'bg-outline-variant'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-surface shadow-soft-md border border-outline-variant/30 p-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={steps[step].id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="space-y-md">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Your organization</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">Tell us about your organization.</p>
                  <div className="space-y-sm">
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Organization name</label>
                      <input value={data.orgName} onChange={(e) => update('orgName', e.target.value)} className="input-base mt-xs" placeholder="e.g. St. Mary's Health" />
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                      <div>
                        <label className="font-label-sm text-label-sm text-on-surface-variant">Type of organization</label>
                        <input
                          value={data.orgType === 'other' ? data.orgTypeCustom : data.orgType}
                          onChange={(e) => {
                            const val = e.target.value
                            // If user starts typing a custom value, treat as custom
                            if (orgTypes.find((t) => t.value === val && t.value !== 'other')) {
                              update('orgType', val)
                              update('orgTypeCustom', '')
                            } else {
                              update('orgType', 'other')
                              update('orgTypeCustom', val)
                            }
                          }}
                          className="input-base mt-xs"
                          placeholder="e.g. Healthcare, Hospital, Retail…"
                        />
                      </div>
                      <div>
                        <label className="font-label-sm text-label-sm text-on-surface-variant">Size</label>
                        <Select value={data.orgSize} onChange={(v) => update('orgSize', v)} options={sizeOptions} className="mt-xs" placeholder="Select size" />
                      </div>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">City, State</label>
                      <input value={data.location} onChange={(e) => update('location', e.target.value)} className="input-base mt-xs" placeholder="e.g. Portland, OR" />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-md">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Admin account</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">This will be the primary account for your organization.</p>
                  <div className="space-y-sm">
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Full name</label>
                      <input value={data.adminName} onChange={(e) => update('adminName', e.target.value)} className="input-base mt-xs" placeholder="e.g. Marcus Holloway" />
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Work email</label>
                      <input type="email" value={data.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} className="input-base mt-xs" placeholder="marcus@yourteam.com" />
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Password</label>
                      <PasswordInput
                        value={data.adminPassword}
                        onChange={(e) => update('adminPassword', e.target.value)}
                        className="input-base mt-xs"
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-md">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Departments</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">Add the departments your organization uses.</p>
                  <div className="flex gap-2">
                    <input
                      value={deptInput}
                      onChange={(e) => setDeptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const trimmed = deptInput.trim()
                          if (trimmed && !data.departments.includes(trimmed)) {
                            update('departments', [...data.departments, trimmed])
                          }
                          setDeptInput('')
                        }
                      }}
                      className="input-base flex-1"
                      placeholder="e.g. Emergency, ICU, Pediatrics..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = deptInput.trim()
                        if (trimmed && !data.departments.includes(trimmed)) {
                          update('departments', [...data.departments, trimmed])
                        }
                        setDeptInput('')
                      }}
                      className="btn-secondary whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add
                    </button>
                  </div>
                  {data.departments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-sm">
                      {data.departments.map((d) => (
                        <span key={d} className="inline-flex items-center gap-1 px-md py-xs rounded-full bg-primary/10 text-primary font-label-sm text-label-sm">
                          {d}
                          <button
                            type="button"
                            onClick={() => update('departments', data.departments.filter((n) => n !== d))}
                            className="hover:text-on-surface transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-md">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Team setup</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">Help us estimate your scheduling needs.</p>
                  <div className="space-y-sm">
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Average staff per department</label>
                      <Select value={data.staffPerDept} onChange={(v) => update('staffPerDept', v)} options={['5–15', '15–30', '30–60', '60–100', '100+'].map((s) => ({ value: s, label: `${s} staff` }))} className="mt-xs" placeholder="Select range" />
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Shift pattern</label>
                      <input value={data.shiftPattern} onChange={(e) => update('shiftPattern', e.target.value)} className="input-base mt-xs" placeholder="e.g. 8-hour (3 shifts/day), 12-hour day/night, mixed..." />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-md">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Review & finish</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">Confirm your details before we set up GhostShift for your team.</p>
                  <div className="space-y-sm rounded-xl bg-surface-variant/50 p-md">
                    {[
                      ['Organization', data.orgName],
                      ['Type', data.orgType === 'other' ? data.orgTypeCustom : orgTypes.find((t) => t.value === data.orgType)?.label],
                      ['Size', sizeOptions.find((s) => s.value === data.orgSize)?.label],
                      ['Location', data.location],
                      ['Admin', data.adminName],
                      ['Email', data.adminEmail],
                      ['Departments', data.departments.join(', ')],
                      ['Staff per dept', data.staffPerDept],
                      ['Shift pattern', data.shiftPattern],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between py-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
                        <span className="font-label-md text-label-md text-on-surface text-right max-w-[60%] truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-xl pt-md border-t border-outline-variant/30">
            <button onClick={prev} disabled={step === 0 || submitting} className="btn-ghost disabled:opacity-40">
              Back
            </button>
            <div className="flex items-center gap-sm">
              {submitError && (
                <p className="font-label-sm text-label-sm text-error mr-sm">{submitError}</p>
              )}
              {step < steps.length - 1 ? (
                <button onClick={next} disabled={!canNext()} className="btn-primary">
                  Continue
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : (
                <button onClick={complete} disabled={submitting || !canNext()} className="btn-primary disabled:opacity-60">
                  {submitting ? 'Setting up…' : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Set up GhostShift
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>

    {/* Right — brand panel */}
    <div className="relative hidden md:block overflow-hidden">
      <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/55 to-primary-900/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-900/70 via-transparent to-transparent" />
      <div className="relative h-full flex flex-col justify-between p-xl lg:p-2xl text-on-primary">
        <Link to="/" className="flex items-center gap-sm">
          <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
            <Logo size={28} />
          </div>
          <span className="font-headline-md text-xl font-bold">GhostShift</span>
        </Link>
        <div className="max-w-md">
          <h1 className="font-display-lg text-display-lg leading-tight drop-shadow-sm">
            Work shouldn't burn you out.
          </h1>
          <p className="mt-md font-body-lg text-body-lg opacity-90 leading-relaxed">
            The intelligent shift-swap and burnout-prediction platform trusted by 200+ shift-based teams.
          </p>
          <div className="mt-xl space-y-sm">
            {[
              { icon: 'auto_awesome', label: 'AI swap matching in 0.8s' },
              { icon: 'monitor_heart', label: 'Burnout prediction 2–3 weeks early' },
              { icon: 'forum', label: 'Conversational scheduling assistant' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-sm rounded-xl bg-white/10 px-sm py-sm">
                <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                <span className="font-body-md text-body-md font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="font-label-sm text-label-sm opacity-70">
          SOC 2 · ISO 27001 · GDPR-ready
        </div>
      </div>
    </div>
  </div>
  )
}
