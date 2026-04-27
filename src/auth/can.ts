// ─────────────────────────────────────────────────────────────────────────
// ABAC layer — extends RBAC with conditions on the actual resource.
//
// RBAC alone can't express:
//   "an employee can only delete invoices THEY created"
//
// The word "they" is a condition on the resource, not a role. That's ABAC.
//
// In production teams often reach for CASL — same idea, declarative API:
//
//   import { defineAbility } from '@casl/ability'
//   const ability = defineAbility((can) => {
//     can('delete', 'Invoice', { created_by: user.id })
//   })
//   ability.can('delete', invoice)
//
// We're writing it ourselves so the logic is unambiguous in ~20 lines.
// ─────────────────────────────────────────────────────────────────────────

import { hasPermission, type Permission } from './roles'
import type { User, Invoice } from '../composables/useStore'

export type CanAction = 'read' | 'create' | 'update' | 'delete' | 'approve'

// Maps each action to the RBAC permission it needs as its baseline.
const ACTION_PERMISSION: Record<CanAction, Permission> = {
  read:    'read:invoices',
  create:  'create:invoices',
  update:  'create:invoices',
  delete:  'delete:invoices',
  approve: 'approve:invoices',
}

/**
 * 👉 LIVE-CODE #4 — the two-layer guard.
 *
 * Replace the body of `can()` so it returns `true` only when both layers agree.
 *
 *   STEP 1 — RBAC base check.
 *   Reuse the matrix you already wrote in roles.ts. The map above
 *   (ACTION_PERMISSION) tells you which permission each action needs.
 *   If RBAC fails, the whole thing fails — short-circuit and return false.
 *
 *   STEP 2 — ABAC conditions on the specific resource.
 *   When `invoice` is null there's no resource to check yet (e.g. listing,
 *   creating). Just trust Step 1 and return true.
 *
 *   Otherwise, branch on `action`:
 *     • 'delete'           → STRICT ownership. Even admin must be the creator.
 *     • 'update'           → creator can always; admin can override.
 *     • 'read'             → employees see only their own; everyone else, all.
 *     • 'create' | 'approve' → no per-row condition; RBAC alone is enough.
 *
 * Tip: each branch is a single comparison, e.g. `invoice.created_by === user.id`.
 */
export function can(_user: User, _action: CanAction, _invoice: Invoice | null): boolean {
  // Placeholder: starts permissive so the app boots with all 50 invoices visible
  // to every role. That's the "broken on purpose" starting state. Replace the
  // body below with the layered RBAC + ABAC logic described in the JSDoc above.
  void hasPermission; void ACTION_PERMISSION
  return true
}

/**
 * Helper used by `list_invoices` and the sidebar — filters a list to what the
 * user is allowed to read. Same pattern as CASL's `accessibleBy`.
 *
 * This calls `can()`, so once you finish #4 above this filter starts working.
 */
export function visibleInvoices(user: User, invoices: Invoice[]): Invoice[] {
  return invoices.filter(i => can(user, 'read', i))
}
