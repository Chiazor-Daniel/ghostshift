import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { roleHome, ROLES } from './data/roles.js'
import RequireRole from './components/RequireRole.jsx'
import { useAuth } from './hooks/useAuth.jsx'
import { realAPI } from './services/realAPI.js'
import LandingPage from './pages/LandingPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import AppShell from './layout/AppShell.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EmployeePortal from './pages/EmployeePortal.jsx'
import MarketplacePage from './pages/MarketplacePage.jsx'
import SwapRequestsPage from './pages/SwapRequestsPage.jsx'
import AvailabilityPage from './pages/AvailabilityPage.jsx'
import InsightsPage from './pages/InsightsPage.jsx'
import EmployeesPage from './pages/EmployeesPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import AcceptInvitePage from './pages/AcceptInvitePage.jsx'
import LeaveRequestsPage from './pages/LeaveRequestsPage.jsx'
import MySwapsPage from './pages/MySwapsPage.jsx'
import AttendancePage from './pages/AttendancePage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
function PageTransition({ children }) {
  return <AnimatePresence>{children}</AnimatePresence>
}

function RoleHomeRedirect({ role }) {
  return <Navigate to={roleHome(role)} replace />
}

const validRole = (r) => (r && ROLES[r] ? r : 'employee')

function GuardedRoute({ roles, activeRole, children }) {
  return (
    <RequireRole roles={roles} activeRole={activeRole}>
      {children}
    </RequireRole>
  )
}

function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!realAPI.token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

export default function App() {
  const location = useLocation()
  const { user } = useAuth()
  const [activeRole, setActiveRole] = useState(() => validRole(localStorage.getItem('gs_role')))

  // Keep activeRole in sync with the real authenticated user
  useEffect(() => {
    if (user?.role) {
      setActiveRole(user.role)
      localStorage.setItem('gs_role', user.role)
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem('gs_role', activeRole)
  }, [activeRole])

  useEffect(() => {
    if (!location.pathname.startsWith('/app')) return
    const stored = validRole(localStorage.getItem('gs_role'))
    if (stored !== activeRole) setActiveRole(stored)
  }, [location.pathname])

  const routeRoles = {
    dashboard: ['admin'],
    employee: ['employee'],
    marketplace: ['employee', 'admin'],
    swaps: ['admin'],
    availability: ['employee', 'admin'],
    insights: ['admin'],
    employees: ['admin'],
    admin: ['admin'],
    profile: ['employee', 'admin'],
    notifications: ['employee', 'admin'],
    leaves: ['employee', 'admin'],
    attendance: ['admin'],
  }

  return (
    <PageTransition>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<OnboardingPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <AppShell activeRole={activeRole} setActiveRole={setActiveRole}>
                <Routes>
                  <Route index element={<RoleHomeRedirect role={activeRole} />} />
                  <Route path="dashboard" element={<GuardedRoute roles={routeRoles.dashboard} activeRole={activeRole}><DashboardPage /></GuardedRoute>} />
                  <Route path="employee" element={<GuardedRoute roles={routeRoles.employee} activeRole={activeRole}><EmployeePortal /></GuardedRoute>} />
                  <Route path="marketplace" element={<GuardedRoute roles={routeRoles.marketplace} activeRole={activeRole}><MarketplacePage /></GuardedRoute>} />
                  <Route path="my-swaps" element={<GuardedRoute roles={['employee']} activeRole={activeRole}><MySwapsPage /></GuardedRoute>} />
                  <Route path="shifts" element={<Navigate to="/app/marketplace" replace />} />
                  <Route path="swaps" element={<GuardedRoute roles={routeRoles.swaps} activeRole={activeRole}><SwapRequestsPage /></GuardedRoute>} />
                  <Route path="swap-requests" element={<Navigate to="/app/swaps" replace />} />
                  <Route path="availability" element={<GuardedRoute roles={routeRoles.availability} activeRole={activeRole}><AvailabilityPage /></GuardedRoute>} />
                  <Route path="insights" element={<GuardedRoute roles={routeRoles.insights} activeRole={activeRole}><InsightsPage /></GuardedRoute>} />
                  <Route path="employees" element={<GuardedRoute roles={routeRoles.employees} activeRole={activeRole}><EmployeesPage /></GuardedRoute>} />
                  <Route path="admin" element={<GuardedRoute roles={routeRoles.admin} activeRole={activeRole}><AdminPage /></GuardedRoute>} />
                  <Route path="profile" element={<GuardedRoute roles={routeRoles.profile} activeRole={activeRole}><ProfilePage /></GuardedRoute>} />
                  <Route path="notifications" element={<GuardedRoute roles={routeRoles.notifications} activeRole={activeRole}><NotificationsPage /></GuardedRoute>} />
                  <Route path="leaves" element={<GuardedRoute roles={routeRoles.leaves} activeRole={activeRole}><LeaveRequestsPage /></GuardedRoute>} />
                  <Route path="attendance" element={<GuardedRoute roles={routeRoles.attendance} activeRole={activeRole}><AttendancePage /></GuardedRoute>} />
                  <Route path="assistant" element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="support" element={<Navigate to="/app/dashboard" replace />} />
                </Routes>
              </AppShell>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  )
}
