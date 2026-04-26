// ─────────────────────────────────────────────────────────────────────────
// RBAC core — roles, permissions, and the simple matrix between them.
//
// Read this file as the answer to two questions:
//   1. Who is using the app?              → Role
//   2. What actions exist in the system?  → Permission
//   3. Which roles can do which actions?  → ROLE_PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'accountant' | 'employee'

export type Permission =
  | 'read:invoices'
  | 'create:invoices'
  | 'delete:invoices'
  | 'approve:invoices'
  | 'read:users'
  | 'manage:users'

export const ALL_PERMISSIONS: Permission[] = [
  'read:invoices',
  'create:invoices',
  'delete:invoices',
  'approve:invoices',
  'read:users',
  'manage:users',
]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'read:invoices', 'create:invoices', 'delete:invoices', 'approve:invoices',
    'read:users', 'manage:users',
  ],
  accountant: [
    'read:invoices', 'create:invoices', 'delete:invoices', 'approve:invoices',
    'read:users',
  ],
  employee: [
    'read:invoices', 'create:invoices', 'delete:invoices',
  ],
}

// The guard at the heart of RBAC. Two lines. That's it.
export function hasPermission(role: Role, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(perm)
}
