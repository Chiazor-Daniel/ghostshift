// GhostShift monogram — Clinical Blue brand mark
export default function Logo({ size = 32, className = '' }) {
  // Unique gradient id so multiple instances don't clash
  const uid = `logoGrad_${size}_${Math.round(size * 13)}`
  const uid2 = `logoGrad2_${size}_${Math.round(size * 17)}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GhostShift"
    >
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={uid2} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${uid})`} />
      {/* ghost outline */}
      <path
        d="M12 19c0-4.4 3.6-8 8-8s8 3.6 8 8v8h-2v-2h-2v2h-2v-2h-2v2h-2v-2h-2v2h-2v-2H12v-8z"
        fill="white"
        fillOpacity="0.96"
      />
      {/* shift indicator */}
      <circle cx="26" cy="27" r="3.5" fill={`url(#${uid2})`} stroke="white" strokeWidth="1.5" />
      {/* arrow inside circle */}
      <path
        d="M26 25v3.5m0-3.5l-1 1m1-1l1 1"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}