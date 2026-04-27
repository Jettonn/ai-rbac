// ─────────────────────────────────────────────────────────────────────────
// RBAC core — roles, permissions, the matrix, and the guard.
//
// We're going to write this together. There are 3 LIVE-CODE spots:
//   1. The Permission union
//   2. The ROLE_PERMISSIONS matrix
//   3. The hasPermission guard
//
// Search the codebase for "LIVE-CODE" to find every spot we'll fill in.
// ─────────────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'accountant' | 'employee'


// 👉 LIVE-CODE #1 — the Permission union.
//
// Define a string-literal union with these six values:
//   read:invoices, create:invoices, delete:invoices, approve:invoices,
//   read:users, manage:users
//
// Convention: 'verb:noun'. Replace `string` below with the union.
export type Permission = string


// Used by PermissionBadges.vue to render the green/grey chips per role.
// Once you finish #1 above, list every permission here as well.
export const ALL_PERMISSIONS: Permission[] = []


// 👉 LIVE-CODE #2 — the ROLE_PERMISSIONS matrix.
//
// Map each role to the array of permissions it has:
//   admin       → all six permissions
//   accountant  → all invoice perms + read:users (no manage:users)
//   employee    → just the three invoice perms (no approve, no users)
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [],
  accountant: [],
  employee: [],
}


// 👉 LIVE-CODE #3 — the guard. The whole RBAC story.
//
// Return true if the role has the permission, false otherwise.
// Hint: ROLE_PERMISSIONS[role] is the array of permissions that role has.
//       Use Array.prototype.includes.
export function hasPermission(_role: Role, _perm: Permission): boolean {
  return false  // ← change me
}
