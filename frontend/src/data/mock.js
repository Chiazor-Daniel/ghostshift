// Centralized mock data for GhostShift — employees, shifts, swaps, burnout metrics
// Used across all pages and flows

export const currentUser = {
  id: 'u-201',
  name: 'Sarah Chen',
  initials: 'SC',
  role: 'employee',
  title: 'Registered Nurse',
  department: 'ICU Ward B',
  email: 'sarah.chen@stmarrys.health',
  phone: '+1 (415) 555-0144',
  avatar:
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=160&h=160&fit=crop&crop=faces&q=80',
  coverColor: '#a5b4fc',
  hiredAt: '2021-03-14',
  certifications: ['BLS', 'ACLS', 'PALS'],
  weeklyHoursTarget: 36,
  weeklyHoursThisWeek: 32,
  preferences: {
    maxConsecutiveDays: 4,
    minHoursBetweenShifts: 8,
    weekendRotation: 'every-third',
  },
}

export const managerUser = {
  id: 'u-101',
  name: 'Dr. Amelia Park',
  initials: 'AP',
  role: 'manager',
  title: 'Charge Nurse Manager',
  department: 'Critical Care',
  email: 'amelia.park@stmarrys.health',
  avatar:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&crop=faces&q=80',
}

export const adminUser = {
  id: 'u-001',
  name: 'Marcus Holloway',
  initials: 'MH',
  role: 'admin',
  title: 'VP of Workforce Operations',
  email: 'marcus.h@stmarrys.health',
  avatar:
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&h=160&fit=crop&crop=faces&q=80',
}


export const departments = [
  { id: 'd-icu', name: 'ICU Ward A', code: 'ICU-A', headcount: 32, color: '#1d4ed8' },
  { id: 'd-icub', name: 'ICU Ward B', code: 'ICU-B', headcount: 28, color: '#0284c7' },
  { id: 'd-er', name: 'ER Triage', code: 'ER', headcount: 41, color: '#ec4899' },
  { id: 'd-peds', name: 'Pediatrics', code: 'PEDS', headcount: 22, color: '#10b981' },
  { id: 'd-lab', name: 'Lab & Diagnostics', code: 'LAB', headcount: 18, color: '#f59e0b' },
  { id: 'd-obs', name: 'Obstetrics', code: 'OBS', headcount: 26, color: '#06b6d4' },
  { id: 'd-or', name: 'Operating Rooms', code: 'OR', headcount: 35, color: '#ef4444' },
  { id: 'd-rad', name: 'Radiology', code: 'RAD', headcount: 14, color: '#2563eb' },
]

export const employees = [
  {
    id: 'e-201',
    name: 'Sarah Chen',
    initials: 'SC',
    role: 'Senior RN',
    dept: 'ICU Ward B',
    avatar:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 28,
    trend: 'stable',
    hoursThisWeek: 32,
    overtime: 0,
    swapsOpen: 1,
    certifications: ['BLS', 'ACLS'],
    rating: 4.9,
  },
  {
    id: 'e-202',
    name: 'Marcus Vance',
    initials: 'MV',
    role: 'RN',
    dept: 'ICU Ward B',
    avatar:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 64,
    trend: 'up',
    hoursThisWeek: 44,
    overtime: 8,
    swapsOpen: 0,
    certifications: ['BLS', 'ACLS', 'PALS'],
    rating: 4.7,
  },
  {
    id: 'e-203',
    name: 'Dr. Elena Rostova',
    initials: 'ER',
    role: 'Attending MD',
    dept: 'ICU Ward B',
    avatar:
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 18,
    trend: 'down',
    hoursThisWeek: 28,
    overtime: 0,
    swapsOpen: 0,
    certifications: ['MD', 'BLS', 'ACLS'],
    rating: 5.0,
  },
  {
    id: 'e-204',
    name: 'James Park',
    initials: 'JP',
    role: 'RN',
    dept: 'ICU Ward B',
    avatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 42,
    trend: 'stable',
    hoursThisWeek: 36,
    overtime: 2,
    swapsOpen: 1,
    certifications: ['BLS'],
    rating: 4.6,
  },
  {
    id: 'e-205',
    name: 'Aisha Mensah',
    initials: 'AM',
    role: 'RN Charge',
    dept: 'ICU Ward A',
    avatar:
      'https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 78,
    trend: 'up',
    hoursThisWeek: 48,
    overtime: 12,
    swapsOpen: 0,
    certifications: ['BLS', 'ACLS', 'PALS', 'TNCC'],
    rating: 4.8,
  },
  {
    id: 'e-206',
    name: 'Daniel Kim',
    initials: 'DK',
    role: 'RT',
    dept: 'ICU Ward B',
    avatar:
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 22,
    trend: 'down',
    hoursThisWeek: 30,
    overtime: 0,
    swapsOpen: 0,
    certifications: ['RRT', 'ACLS'],
    rating: 4.9,
  },
  {
    id: 'e-207',
    name: 'Olivia Reyes',
    initials: 'OR',
    role: 'RN',
    dept: 'ER Triage',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 88,
    trend: 'up',
    hoursThisWeek: 52,
    overtime: 16,
    swapsOpen: 2,
    certifications: ['BLS', 'ACLS', 'CEN'],
    rating: 4.5,
  },
  {
    id: 'e-208',
    name: 'Tomás Aguilar',
    initials: 'TA',
    role: 'CNA',
    dept: 'ICU Ward A',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 34,
    trend: 'stable',
    hoursThisWeek: 32,
    overtime: 0,
    swapsOpen: 1,
    certifications: ['BLS'],
    rating: 4.7,
  },
  {
    id: 'e-209',
    name: 'Priya Singh',
    initials: 'PS',
    role: 'Pharmacist',
    dept: 'Pharmacy',
    avatar:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 46,
    trend: 'stable',
    hoursThisWeek: 40,
    overtime: 4,
    swapsOpen: 0,
    certifications: ['PharmD'],
    rating: 4.8,
  },
  {
    id: 'e-210',
    name: 'Jordan Bennett',
    initials: 'JB',
    role: 'RN',
    dept: 'Pediatrics',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 56,
    trend: 'up',
    hoursThisWeek: 42,
    overtime: 6,
    swapsOpen: 1,
    certifications: ['BLS', 'PALS'],
    rating: 4.6,
  },
  {
    id: 'e-211',
    name: 'Mira Hassan',
    initials: 'MH',
    role: 'RN',
    dept: 'Obstetrics',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 31,
    trend: 'down',
    hoursThisWeek: 36,
    overtime: 0,
    swapsOpen: 0,
    certifications: ['BLS', 'NRP'],
    rating: 4.9,
  },
  {
    id: 'e-212',
    name: 'Riley Cooper',
    initials: 'RC',
    role: 'Surgical Tech',
    dept: 'Operating Rooms',
    avatar:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&h=120&fit=crop&crop=faces&q=80',
    burnoutScore: 72,
    trend: 'up',
    hoursThisWeek: 46,
    overtime: 10,
    swapsOpen: 1,
    certifications: ['CST'],
    rating: 4.4,
  },
]

// Shifts on the schedule — wide date range so the calendar never feels empty
const today = new Date('2026-06-27')
const days = [...Array(7)].map((_, i) => {
  const d = new Date(today)
  d.setDate(today.getDate() - 3 + i)
  return d
})

export const shifts = [
  // Today
  {
    id: 's-001',
    employeeId: 'e-201',
    title: 'ICU Ward B',
    role: 'RN Day',
    department: 'ICU Ward B',
    date: days[3],
    startHour: 7,
    durationHours: 12,
    status: 'active',
    notes: 'Charge nurse',
  },
  {
    id: 's-002',
    employeeId: 'e-202',
    title: 'ICU Ward B',
    role: 'RN Day',
    department: 'ICU Ward B',
    date: days[3],
    startHour: 7,
    durationHours: 12,
    status: 'active',
  },
  {
    id: 's-003',
    employeeId: 'e-204',
    title: 'ER Triage',
    role: 'RN Day',
    department: 'ER Triage',
    date: days[3],
    startHour: 9,
    durationHours: 12,
    status: 'open',
    requiredStaff: 3,
    assignedStaff: ['e-204'],
  },
  {
    id: 's-004',
    employeeId: 'e-206',
    title: 'ICU Ward B',
    role: 'RT Day',
    department: 'ICU Ward B',
    date: days[3],
    startHour: 7,
    durationHours: 12,
    status: 'active',
  },
  {
    id: 's-005',
    employeeId: 'e-211',
    title: 'Obstetrics',
    role: 'RN Day',
    department: 'Obstetrics',
    date: days[3],
    startHour: 7,
    durationHours: 12,
    status: 'active',
  },
  {
    id: 's-006',
    employeeId: 'e-209',
    title: 'Pharmacy',
    role: 'Pharm Day',
    department: 'Pharmacy',
    date: days[3],
    startHour: 8,
    durationHours: 10,
    status: 'active',
  },
  // Tomorrow
  {
    id: 's-007',
    employeeId: 'e-201',
    title: 'ICU Ward B',
    role: 'RN Day',
    department: 'ICU Ward B',
    date: days[4],
    startHour: 7,
    durationHours: 12,
    status: 'scheduled',
  },
  {
    id: 's-007b',
    employeeId: 'e-201',
    title: 'ER Triage',
    role: 'RN Float',
    department: 'ER Triage',
    date: days[4],
    startHour: 19,
    durationHours: 4,
    status: 'scheduled',
  },
  {
    id: 's-008',
    employeeId: 'e-207',
    title: 'ER Triage',
    role: 'RN Night',
    department: 'ER Triage',
    date: days[4],
    startHour: 19,
    durationHours: 12,
    status: 'scheduled',
  },
  {
    id: 's-009',
    employeeId: 'e-210',
    title: 'Pediatrics',
    role: 'RN Day',
    department: 'Pediatrics',
    date: days[4],
    startHour: 7,
    durationHours: 12,
    status: 'scheduled',
  },
  {
    id: 's-010',
    employeeId: 'e-212',
    title: 'Operating Rooms',
    role: 'Surg Tech',
    department: 'Operating Rooms',
    date: days[4],
    startHour: 6,
    durationHours: 10,
    status: 'open',
    requiredStaff: 2,
    assignedStaff: ['e-212'],
  },
  {
    id: 's-011',
    employeeId: 'e-208',
    title: 'ICU Ward A',
    role: 'CNA Night',
    department: 'ICU Ward A',
    date: days[4],
    startHour: 19,
    durationHours: 12,
    status: 'open',
    requiredStaff: 2,
    assignedStaff: ['e-208'],
  },
  // Yesterday
  {
    id: 's-012',
    employeeId: 'e-201',
    title: 'ICU Ward B',
    role: 'RN Day',
    department: 'ICU Ward B',
    date: days[2],
    startHour: 7,
    durationHours: 12,
    status: 'completed',
  },
  {
    id: 's-013',
    employeeId: 'e-202',
    title: 'ICU Ward B',
    role: 'RN Day',
    department: 'ICU Ward B',
    date: days[2],
    startHour: 7,
    durationHours: 12,
    status: 'completed',
  },
  // Day after
  {
    id: 's-014',
    employeeId: 'e-201',
    title: 'Pediatrics',
    role: 'RN Cross-cover',
    department: 'Pediatrics',
    date: days[5],
    startHour: 7,
    durationHours: 12,
    status: 'scheduled',
  },
  {
    id: 's-015',
    employeeId: 'e-204',
    title: 'ICU Ward B',
    role: 'RN Day',
    department: 'ICU Ward B',
    date: days[5],
    startHour: 7,
    durationHours: 12,
    status: 'open',
  },
  // Friday
  {
    id: 's-016',
    employeeId: 'e-201',
    title: 'ICU Ward B',
    role: 'RN Day',
    department: 'ICU Ward B',
    date: days[6],
    startHour: 7,
    durationHours: 12,
    status: 'open',
  },
  {
    id: 's-017',
    employeeId: 'e-206',
    title: 'ICU Ward B',
    role: 'RT Day',
    department: 'ICU Ward B',
    date: days[6],
    startHour: 7,
    durationHours: 12,
    status: 'scheduled',
  },
]

// Pending swap requests — what managers need to approve
export const swapRequests = [
  {
    id: 'sw-001',
    requesterId: 'e-207',
    requesterName: 'Olivia Reyes',
    requesterAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces&q=80',
    targetId: 'e-210',
    targetName: 'Jordan Bennett',
    targetAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces&q=80',
    fromShift: { id: 's-008', date: days[4], role: 'ER Triage RN Night', dept: 'ER Triage' },
    toShift: { id: 's-009', date: days[4], role: 'Peds RN Day', dept: 'Pediatrics' },
    reason: 'Family event — need to be off Friday evening.',
    aiScore: 87,
    aiConcerns: ['Peds requires PALS cert — Jordan has it. ✓', 'ER dept loses night coverage but Sarah K covers as backup'],
    status: 'pending',
    submittedAt: '2026-06-26T14:32:00Z',
  },
  {
    id: 'sw-002',
    requesterId: 'e-204',
    requesterName: 'James Park',
    requesterAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=80&h=80&fit=crop&crop=faces&q=80',
    targetId: 'e-201',
    targetName: 'Sarah Chen',
    targetAvatar:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=faces&q=80',
    fromShift: { id: 's-003', date: days[3], role: 'ER Triage RN Day', dept: 'ER Triage' },
    toShift: { id: 's-007', date: days[4], role: 'ICU-B RN Day', dept: 'ICU Ward B' },
    reason: 'Driving test scheduled; need Saturday morning free.',
    aiScore: 94,
    aiConcerns: [
      'Sarah is already ICU-B regular — minimal orientation needed',
      'No cert gaps detected',
      'Workload balance: both shifts 12h, neutral net impact',
    ],
    status: 'pending',
    submittedAt: '2026-06-26T11:18:00Z',
  },
  {
    id: 'sw-003',
    requesterId: 'e-208',
    requesterName: 'Tomás Aguilar',
    requesterAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces&q=80',
    targetId: 'e-202',
    targetName: 'Marcus Vance',
    targetAvatar:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop&crop=faces&q=80',
    fromShift: { id: 's-011', date: days[4], role: 'ICU-A CNA Night', dept: 'ICU Ward A' },
    toShift: { id: 's-002', date: days[3], role: 'ICU-B RN Day', dept: 'ICU Ward B' },
    reason: 'Want to observe a senior RN before starting nursing program.',
    aiScore: 71,
    aiConcerns: [
      '⚠ Marcus approaching OT (44h/wk)',
      'Cross-department swap from CNA→RN requires manager review',
      'Tomás is in shadow program — could be approved as training credit',
    ],
    status: 'needs-review',
    submittedAt: '2026-06-25T19:05:00Z',
  },
  {
    id: 'sw-004',
    requesterId: 'e-201',
    requesterName: 'Sarah Chen',
    requesterAvatar:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=faces&q=80',
    targetId: 'e-204',
    targetName: 'James Park',
    targetAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=80&h=80&fit=crop&crop=faces&q=80',
    fromShift: { id: 's-007', date: days[4], role: 'ICU-B RN Day', dept: 'ICU Ward B' },
    toShift: { id: 's-014', date: days[5], role: 'Peds Cross-cover', dept: 'Pediatrics' },
    reason: 'Cross-cover shift is outside my cert scope — need PALS recert before taking it.',
    aiScore: 92,
    aiConcerns: [
      'Both employees BLS + ACLS certified',
      'James has 3 mo on ICU-B team — meets unit standard',
      'Net weekly hours balanced',
    ],
    status: 'pending',
    submittedAt: '2026-06-26T08:42:00Z',
  },
]

// Open shifts in the marketplace
export const marketplaceShifts = [
  {
    id: 'm-001',
    department: 'ER Triage',
    role: 'RN Night',
    date: days[4],
    startHour: 19,
    durationHours: 12,
    urgency: 'high',
    payDifferential: '+25%',
    eligible: 14,
    swapsAlreadyRequested: 1,
    description:
      'High-volume shift. Trauma experience preferred but not required. Charge RN on duty.',
    tags: ['Night', 'Trauma', 'High Volume'],
  },
  {
    id: 'm-002',
    department: 'Operating Rooms',
    role: 'Surgical Tech',
    date: days[4],
    startHour: 6,
    durationHours: 10,
    urgency: 'medium',
    payDifferential: '+15%',
    eligible: 6,
    swapsAlreadyRequested: 0,
    description: 'Orthopedic case load. CST certification required. End at 4:30 PM sharp.',
    tags: ['Day', 'Ortho', 'CST Required'],
  },
  {
    id: 'm-003',
    department: 'ICU Ward A',
    role: 'CNA Night',
    date: days[4],
    startHour: 19,
    durationHours: 12,
    urgency: 'low',
    payDifferential: 'Flat',
    eligible: 9,
    swapsAlreadyRequested: 0,
    description: 'Stable census. CNA I or II accepted. Tuition reimbursement-eligible shifts.',
    tags: ['Night', 'CNA I', 'Stable'],
  },
  {
    id: 'm-004',
    department: 'Pediatrics',
    role: 'RN Day',
    date: days[5],
    startHour: 7,
    durationHours: 12,
    urgency: 'low',
    payDifferential: 'Flat',
    eligible: 11,
    swapsAlreadyRequested: 0,
    description: 'Low-acuity peds. PALS required. Great for new peds RNs or cross-trainers.',
    tags: ['Day', 'PALS', 'Family Friendly'],
  },
  {
    id: 'm-005',
    department: 'Lab & Diagnostics',
    role: 'Phlebotomist',
    date: days[5],
    startHour: 8,
    durationHours: 8,
    urgency: 'medium',
    payDifferential: '+10%',
    eligible: 7,
    swapsAlreadyRequested: 0,
    description: 'AM draws. ASCP certification required. Quiet unit, family-friendly hours.',
    tags: ['Day', '8h', 'Short Shift'],
  },
  {
    id: 'm-006',
    department: 'ICU Ward B',
    role: 'RN Day',
    date: days[5],
    startHour: 7,
    durationHours: 12,
    urgency: 'high',
    payDifferential: '+20%',
    eligible: 4,
    swapsAlreadyRequested: 2,
    description: 'Busy ICU shift. Senior RN preferred. Charge RN already on unit.',
    tags: ['Day', 'Senior', 'Critical Care'],
  },
  {
    id: 'm-007',
    department: 'Obstetrics',
    role: 'RN Night',
    date: days[6],
    startHour: 19,
    durationHours: 12,
    urgency: 'medium',
    payDifferential: '+12%',
    eligible: 8,
    swapsAlreadyRequested: 0,
    description: 'L&D unit. NRP required. Midwife coverage on-call.',
    tags: ['Night', 'L&D', 'NRP'],
  },
]

// Availability template grid — 7 days × 4 time slots
export const availabilityTemplate = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  slots: ['Morning (7-3)', 'Afternoon (3-11)', 'Night (11-7)', 'Off'],
  grid: [
    // Mon
    [
      { available: true, pref: 'preferred' },
      { available: true, pref: 'neutral' },
      { available: false, pref: 'unavailable' },
      { available: false, pref: 'unavailable' },
    ],
    // Tue
    [
      { available: true, pref: 'preferred' },
      { available: false, pref: 'unavailable' },
      { available: true, pref: 'neutral' },
      { available: false, pref: 'unavailable' },
    ],
    // Wed
    [
      { available: true, pref: 'preferred' },
      { available: true, pref: 'preferred' },
      { available: false, pref: 'unavailable' },
      { available: false, pref: 'unavailable' },
    ],
    // Thu
    [
      { available: true, pref: 'neutral' },
      { available: true, pref: 'neutral' },
      { available: true, pref: 'neutral' },
      { available: false, pref: 'unavailable' },
    ],
    // Fri
    [
      { available: true, pref: 'preferred' },
      { available: true, pref: 'neutral' },
      { available: false, pref: 'unavailable' },
      { available: false, pref: 'unavailable' },
    ],
    // Sat
    [
      { available: false, pref: 'unavailable' },
      { available: false, pref: 'unavailable' },
      { available: true, pref: 'neutral' },
      { available: true, pref: 'preferred' },
    ],
    // Sun
    [
      { available: false, pref: 'unavailable' },
      { available: false, pref: 'unavailable' },
      { available: false, pref: 'unavailable' },
      { available: true, pref: 'preferred' },
    ],
  ],
}

// Burnout heatmap data — departments × weeks
export const burnoutHeatmap = {
  weeks: ['Wk 22', 'Wk 23', 'Wk 24', 'Wk 25', 'Wk 26'],
  departments: ['ICU-A', 'ICU-B', 'ER', 'PEDS', 'LAB', 'OBS', 'OR', 'RAD'],
  // values are 0-100 burnout scores
  values: [
    [42, 48, 55, 62, 71], // ICU-A trending up
    [28, 32, 36, 38, 41], // ICU-B stable
    [68, 74, 78, 84, 88], // ER critical
    [38, 42, 45, 49, 52], // PEDS
    [22, 24, 28, 32, 35], // LAB
    [31, 34, 36, 33, 30], // OBS
    [54, 58, 62, 68, 72], // OR
    [18, 22, 24, 26, 28], // RAD
  ],
}

export const burnoutDistribution = [
  { name: 'Optimal', value: 78, color: '#10b981' },
  { name: 'Watch', value: 32, color: '#f59e0b' },
  { name: 'Elevated', value: 14, color: '#f97316' },
  { name: 'Critical', value: 8, color: '#ef4444' },
]

export const weeklyHoursTrend = [
  { week: 'Wk 21', scheduled: 36, worked: 34, ot: 0 },
  { week: 'Wk 22', scheduled: 36, worked: 38, ot: 2 },
  { week: 'Wk 23', scheduled: 36, worked: 42, ot: 6 },
  { week: 'Wk 24', scheduled: 36, worked: 40, ot: 4 },
  { week: 'Wk 25', scheduled: 36, worked: 38, ot: 2 },
  { week: 'Wk 26', scheduled: 36, worked: 32, ot: 0 },
]

export const aiMatchingHistory = [
  {
    id: 'm-h-001',
    date: '2026-06-26',
    shift: 'ICU-B RN Night',
    topMatch: 'Daniel Kim',
    score: 96,
    outcome: 'accepted',
  },
  {
    id: 'm-h-002',
    date: '2026-06-25',
    shift: 'ER Triage RN',
    topMatch: 'Aisha Mensah',
    score: 91,
    outcome: 'accepted',
  },
  {
    id: 'm-h-003',
    date: '2026-06-24',
    shift: 'OR Surg Tech',
    topMatch: 'Olivia Reyes',
    score: 82,
    outcome: 'declined',
  },
  {
    id: 'm-h-004',
    date: '2026-06-23',
    shift: 'Peds RN Day',
    topMatch: 'Mira Hassan',
    score: 88,
    outcome: 'accepted',
  },
]

// AI engine tuning console
export const aiEngineConfig = {
  matching: {
    certMatchWeight: 0.4,
    preferenceWeight: 0.25,
    burnoutRiskWeight: 0.2,
    costWeight: 0.1,
    seniorityWeight: 0.05,
  },
  burnout: {
    hoursWeight: 0.35,
    nightShiftWeight: 0.2,
    weekendWeight: 0.15,
    consecutiveDaysWeight: 0.15,
    patientLoadWeight: 0.15,
  },
  thresholds: {
    burnoutAlertLevel: 70,
    burnoutCriticalLevel: 85,
    autoApproveScore: 90,
    requireManagerReview: 75,
  },
  model: {
    version: 'LightGBM v4.2',
    lastTrained: '2026-06-15',
    accuracy: 0.924,
    precision: 0.901,
    recall: 0.887,
    f1: 0.894,
  },
}

// Notifications feed
export const notifications = [
  {
    id: 'n-001',
    type: 'swap-pending',
    title: 'New swap request from James Park',
    body: 'Wants to swap Friday day shift — AI score 94%',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 'n-002',
    type: 'burnout-alert',
    title: 'Burnout risk elevated',
    body: 'Olivia Reyes crossed 85% burnout threshold',
    time: '14 min ago',
    unread: true,
  },
  {
    id: 'n-003',
    type: 'ai-suggestion',
    title: 'AI found 3 better matches',
    body: 'For open ICU-B shift on Friday',
    time: '32 min ago',
    unread: true,
  },
  {
    id: 'n-004',
    type: 'swap-approved',
    title: 'Swap approved',
    body: 'Your Thursday ICU-B shift swapped with James Park',
    time: '1 hour ago',
    unread: false,
  },
  {
    id: 'n-005',
    type: 'schedule-published',
    title: 'July schedule published',
    body: 'Draft now open for self-scheduling until 7/1',
    time: '3 hours ago',
    unread: false,
  },
  {
    id: 'n-006',
    type: 'cert-expiring',
    title: 'PALS cert expiring in 14 days',
    body: 'Recertification class available — auto-enroll?',
    time: 'Yesterday',
    unread: false,
  },
]

// Activity feed (system-wide)
export const activityFeed = [
  { id: 'a-001', actor: 'AI Engine', action: 'matched', target: 'Daniel Kim → ICU-B RN Night', time: '8 min ago' },
  { id: 'a-002', actor: 'Amelia Park', action: 'approved swap', target: 'Olivia Reyes ↔ Jordan Bennett', time: '24 min ago' },
  { id: 'a-003', actor: 'AI Engine', action: 'flagged', target: 'Olivia Reyes (burnout 88%)', time: '46 min ago' },
  { id: 'a-004', actor: 'HR', action: 'published policy', target: 'New OT policy effective 7/1', time: '2 hours ago' },
  { id: 'a-005', actor: 'Sarah Chen', action: 'requested swap', target: 'Thu ICU-B → Fri Peds', time: '3 hours ago' },
  { id: 'a-006', actor: 'AI Engine', action: 'predicted', target: '12 high-risk shifts next week', time: '5 hours ago' },
]

// Onboarding (for landing page demo)
export const heroStats = [
  { value: '47%', label: 'fewer uncovered shifts', sublabel: 'vs. baseline operations' },
  { value: '3.2x', label: 'faster shift fulfillment', sublabel: 'from request → confirmed' },
  { value: '62%', label: 'burnout incidents prevented', sublabel: 'across pilot departments' },
  { value: '94%', label: 'staff satisfaction', sublabel: 'after 90-day deployment' },
]

export const testimonials = [
  {
    quote:
      'We dropped uncovered shifts by half in the first quarter. The burnout predictions are scary-accurate — we intervene before someone quits.',
    author: 'Dr. Lena Whitfield',
    role: 'Chief Nursing Officer, St. Mary\'s Health',
    avatar:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=120&h=120&fit=crop&crop=faces&q=80',
  },
  {
    quote:
      'I used to spend Sunday nights staring at the schedule, dreading the week. Now GhostShift shows me exactly when I\'m overloaded — and how to fix it.',
    author: 'Marcus Vance, RN',
    role: 'ICU Ward B',
    avatar:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop&crop=faces&q=80',
  },
  {
    quote:
      'The AI matching feels like it knows my team better than I do. It weighs preferences, certs, and burnout risk — all in milliseconds.',
    author: 'Dr. Amelia Park',
    role: 'Charge Nurse Manager',
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces&q=80',
  },
]

export const featurePillars = [
  {
    icon: 'auto_awesome',
    title: 'AI Swap Matching',
    desc: 'Constraint-satisfaction engine (Google OR-Tools) ranks eligible peers by certifications, preferences, burnout risk, and cost. Sub-second match results.',
    color: 'primary',
  },
  {
    icon: 'monitor_heart',
    title: 'Burnout Prediction',
    desc: 'LightGBM model ingests hours, shift patterns, PTO, and patient load to surface at-risk staff 2-3 weeks early — before they burn out or quit.',
    color: 'rose',
  },
  {
    icon: 'forum',
    title: 'Conversational Assistant',
    desc: 'LLM-powered assistant ("Shift") answers schedule questions in plain English, drafts swap requests, and explains AI recommendations.',
    color: 'emerald',
  },
  {
    icon: 'inventory_2',
    title: 'Marketplace Self-Service',
    desc: 'Open shifts post to a marketplace where qualified peers opt in. Differential pay, training credit, and seniority preferences respected automatically.',
    color: 'amber',
  },
]

export const integrationLogos = [
  'Workday',
  'Kronos',
  'UKG',
  'ADP',
  'Cerner',
  'Epic',
  'Shiftboard',
  'Microsoft',
]

export const pricingTiers = [
  {
    name: 'Starter',
    price: '$8',
    per: '/employee / mo',
    description: 'For small clinics and single departments getting started with AI scheduling.',
    features: [
      'AI swap matching (up to 50 staff)',
      'Basic burnout risk scoring',
      'Mobile app for staff',
      'Email support',
      'Standard integrations (Workday, ADP)',
    ],
    cta: 'Start 14-day trial',
    highlight: false,
  },
  {
    name: 'Clinical',
    price: '$18',
    per: '/employee / mo',
    description: 'For clinical units and mid-size departments with rotating schedules.',
    features: [
      'Everything in Starter, plus:',
      'LightGBM burnout prediction (full model)',
      'Conversational assistant (LLM)',
      'Marketplace & differential pay engine',
      'Manager analytics dashboard',
      'Slack + Teams integrations',
      'Priority support',
    ],
    cta: 'Start 14-day trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    per: '',
    description: 'For health systems with 500+ staff, multi-site operations, and complex rules.',
    features: [
      'Everything in Clinical, plus:',
      'Multi-site org hierarchy',
      'Custom model training on your data',
      'SSO + SCIM provisioning',
      'Dedicated success manager',
      'Custom SLA + on-call support',
      'HIPAA BAA + SOC 2 Type II',
    ],
    cta: 'Talk to sales',
    highlight: false,
  },
]

// Org-wide KPIs
export const orgKPIs = {
  activeStaff: 128,
  shiftsThisWeek: 412,
  unfilledShifts: 14,
  swapSuccessRate: 0.92,
  avgMatchTime: 47, // seconds
  burnoutReduction: 0.62,
}

// Certifications lookup
export const certifications = [
  { code: 'BLS', name: 'Basic Life Support' },
  { code: 'ACLS', name: 'Advanced Cardiac Life Support' },
  { code: 'PALS', name: 'Pediatric Advanced Life Support' },
  { code: 'NRP', name: 'Neonatal Resuscitation' },
  { code: 'TNCC', name: 'Trauma Nursing Core Course' },
  { code: 'CEN', name: 'Certified Emergency Nurse' },
  { code: 'RRT', name: 'Registered Respiratory Therapist' },
  { code: 'CST', name: 'Certified Surgical Technologist' },
  { code: 'PharmD', name: 'Doctor of Pharmacy' },
]

export const policies = [
  { id: 'p-001', name: 'Max weekly hours', value: '40h standard / 48h OT threshold', category: 'overtime' },
  { id: 'p-002', name: 'Min rest between shifts', value: '8 hours', category: 'rest' },
  { id: 'p-003', name: 'Max consecutive days', value: '5 days', category: 'rest' },
  { id: 'p-004', name: 'Weekend rotation', value: 'Every 3rd weekend', category: 'fairness' },
  { id: 'p-005', name: 'Holiday rotation', value: 'Even distribution by seniority', category: 'fairness' },
  { id: 'p-006', name: 'Burnout alert threshold', value: '70% (warn) / 85% (critical)', category: 'wellbeing' },
]

export const auditLog = [
  { id: 'au-001', actor: 'Amelia Park', action: 'Approved swap sw-001', target: 'Olivia Reyes ↔ Jordan Bennett', time: '2026-06-27 09:14' },
  { id: 'au-002', actor: 'AI Engine', action: 'Auto-assigned shift s-016', target: 'Sarah Chen (98% match)', time: '2026-06-27 08:42' },
  { id: 'au-003', actor: 'Sarah Chen', action: 'Updated availability', target: 'Tue Afternoon → unavailable', time: '2026-06-26 19:08' },
  { id: 'au-004', actor: 'Marcus Holloway', action: 'Published policy', target: 'New OT threshold (40h → 48h)', time: '2026-06-25 14:22' },
  { id: 'au-005', actor: 'AI Engine', action: 'Retrained burnout model', target: 'LightGBM v4.2 (acc 92.4%)', time: '2026-06-15 02:00' },
]

export function getEmployee(id) {
  return employees.find((e) => e.id === id)
}

export function getShiftById(id) {
  return shifts.find((s) => s.id === id)
}

export function getDateLabel(date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function getTimeLabel(hour) {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatTime(hour) {
  return getTimeLabel(hour)
}