// Two roles: employee and admin. Admin oversees everything.

export const ROLES = {
  employee: {
    id: 'employee',
    name: 'Employee',
    title: 'Clinician',
    icon: 'person',
    home: '/app/employee',
    blurb: 'My schedule, swap requests, availability',
  },
  admin: {
    id: 'admin',
    name: 'Administrator',
    title: 'Workforce Admin',
    icon: 'admin_panel_settings',
    home: '/app/dashboard',
    blurb: 'Team oversight, org settings, insights',
  },
}

export const roleOrder = ['employee', 'admin']

export const roleHome = (role) => ROLES[role]?.home || '/app/employee'