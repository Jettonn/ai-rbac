// ─────────────────────────────────────────────────────────────────────────
// Tool definitions — what the LLM can attempt to do.
//
// Each ToolDefinition serves TWO audiences:
//   • The LLM reads `name` + `description` + `parameters` to choose what to call.
//   • Our guard reads `requiredPermission` + `action` to decide whether to allow.
//
// The LLM never sees `requiredPermission` or `action`. That's why prompt
// injection can't bypass the guard — the rule isn't in the prompt.
// ─────────────────────────────────────────────────────────────────────────

import type { Permission } from './roles'
import type { CanAction } from './can'

export interface ToolDefinition {
  name: string
  description: string
  requiredPermission: Permission
  // Optional — only set for tools that operate on a specific Invoice.
  // Triggers the ABAC layer in the guard.
  action?: CanAction
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description?: string }>
    required: string[]
    [key: string]: unknown
  }
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'list_invoices',
    description: 'List invoices visible to the current user (scoped by ABAC).',
    requiredPermission: 'read:invoices',
    action: 'read',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'create_invoice',
    description: 'Create a new draft invoice. The current user becomes its creator.',
    requiredPermission: 'create:invoices',
    action: 'create',
    parameters: {
      type: 'object',
      properties: {
        customer: { type: 'string', description: 'Customer name.' },
        amount:   { type: 'number', description: 'Invoice amount in USD.' },
      },
      required: ['customer', 'amount'],
    },
  },
  {
    name: 'delete_invoice',
    description: 'Delete an invoice. Strict creator-only — even admin cannot delete invoices they did not create.',
    requiredPermission: 'delete:invoices',
    action: 'delete',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Invoice ID to delete.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'approve_invoice',
    description: 'Mark an invoice as paid. Accountant or admin only.',
    requiredPermission: 'approve:invoices',
    action: 'approve',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Invoice ID to approve.' },
      },
      required: ['id'],
    },
  },
  // 👉 LIVE-CODE #6 — add the two report tools.
  //
  // Use the entries above (list_invoices, create_invoice, …) as templates.
  // Handlers are already wired in useStore.ts and dispatched from useAgent.ts —
  // once you add the entries here, the LLM can pick them and pills light up.
  //
  // 6a) monthly_report
  //     Aggregates the current user's own invoices for a given month.
  //     Description: tell the LLM what it returns (total billed, total paid,
  //                  count by status). Reading is the action.
  //     requiredPermission: 'read:invoices'
  //     action:             'read'           ← triggers ABAC at dispatch time
  //     parameters:         optional `month` param in 'YYYY-MM' format.
  //
  // 6b) forward_report_to_accountant
  //     Forwards the most recent monthly_report to an accountant via the
  //     /api/send-email middleware (or the Outbox panel in fake mode).
  //     requiredPermission: 'read:invoices'
  //     action:             ✗ leave it OFF — this tool isn't bound to a
  //                         specific invoice row, so RBAC alone is enough.
  //     parameters:         optional `month` param.
]

export function findTool(name: string): ToolDefinition | undefined {
  return TOOLS.find(t => t.name === name)
}
