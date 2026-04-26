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
 * The two-layer guard.
 *
 * Step 1: RBAC — does this role have the permission at all?
 * Step 2: ABAC — does this user pass the conditions on this specific resource?
 *
 * Returns false if either layer rejects.
 */
export function can(user: User, action: CanAction, invoice: Invoice | null): boolean {
  // Step 1 — RBAC base check
  if (!hasPermission(user.role, ACTION_PERMISSION[action])) return false

  // Step 2 — ABAC conditions (only when there's a specific resource)
  if (!invoice) return true

  // Strict ownership on delete — applies to everyone, even admin.
  if (action === 'delete') {
    return invoice.created_by === user.id
  }

  // Update — only the creator can modify (admin can override).
  if (action === 'update') {
    return user.role === 'admin' || invoice.created_by === user.id
  }

  // Read — employees see only their own; accountant + admin see all.
  if (action === 'read') {
    if (user.role === 'employee') return invoice.created_by === user.id
    return true
  }

  // Create + approve — RBAC alone is sufficient, no ownership condition.
  return true
}

/**
 * Helper used by `list_invoices` and the sidebar — filters a list to what the
 * user is allowed to read. Same call-site pattern as CASL's `accessibleBy`.
 */
export function visibleInvoices(user: User, invoices: Invoice[]): Invoice[] {
  return invoices.filter(i => can(user, 'read', i))
}

/**
 * Why a hand-rolled `can()` and not CASL?
 *
 *   - Pedagogy: every line is grep-able. No black boxes during the lecture.
 *   - Scope: ~6 rules. CASL pays off at ~50+.
 *   - Refactor path: the function signature `can(user, action, resource)`
 *     mirrors `ability.can(action, resource)` — porting to CASL later is
 *     line-for-line.
 *
 * If you ever scale this to dozens of conditional rules, swap the body for:
 *
 *   import { defineAbility } from '@casl/ability'
 *   const ability = defineAbility((can) => { ...rules... })
 *   return ability.can(action, subject('Invoice', resource))
 *
 * The call sites stay identical.
 */
