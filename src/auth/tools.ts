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
  {
    name: 'monthly_report',
    description:
      'Aggregate the current user\'s own invoices for a given month. Returns total billed, total paid, count by status.',
    requiredPermission: 'read:invoices',
    action: 'read',
    parameters: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: 'Month in YYYY-MM format. Defaults to current month if omitted.',
        },
      },
      required: [],
    },
  },
  {
    name: 'forward_report_to_accountant',
    description:
      'Forward the most recent monthly_report result to an accountant by email. Emails are logged to the outbox panel.',
    requiredPermission: 'read:invoices',
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'YYYY-MM month the report covered.' },
      },
      required: [],
    },
  },
]

export function findTool(name: string): ToolDefinition | undefined {
  return TOOLS.find(t => t.name === name)
}
