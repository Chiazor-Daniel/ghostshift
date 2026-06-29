import { Navigate } from 'react-router-dom'
import { roleHome } from '../data/roles.js'

export default function RequireRole({ roles, activeRole, children }) {
  if (!roles.includes(activeRole)) {
    return <Navigate to={roleHome(activeRole)} replace />
  }
  return children
}
