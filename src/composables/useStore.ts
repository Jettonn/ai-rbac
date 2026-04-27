// ─────────────────────────────────────────────────────────────────────────
// Reactive store: users, invoices, current user identity, outbox.
//
// Seeded from /public/users.csv + /public/invoices.csv on first mount.
// Module-level refs => singleton state shared across all useStore() callers.
// ─────────────────────────────────────────────────────────────────────────

import { ref, onMounted } from 'vue'
import type { Role } from '../auth/roles'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface Invoice {
  id: string
  customer: string
  amount: number
  status: InvoiceStatus
  created_by: string  // User.id — the ABAC anchor
  created_at: string  // YYYY-MM-DD
}

export interface EmailEntry {
  at: string
  to: string
  subject: string
  body: string
}

const users = ref<User[]>([])
const invoices = ref<Invoice[]>([])
const outbox = ref<EmailEntry[]>([])
const currentUser = ref<User | null>(null)
const lastReportMonth = ref<string | null>(null)
const seeded = ref(false)

// Exposed for `useAgent.ts` to read directly during ABAC checks.
export const storeRefs = { users, invoices, outbox, currentUser, lastReportMonth }

function parseUsersCsv(text: string): User[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length <= 1) return []
  return lines.slice(1).map(row => {
    const [id, name, email, role] = row.split(',')
    return { id, name, email, role: (role as Role) ?? 'employee' }
  })
}

function parseInvoicesCsv(text: string): Invoice[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length <= 1) return []
  return lines.slice(1).map(row => {
    const [id, customer, amount, status, created_by, created_at] = row.split(',')
    return {
      id,
      customer,
      amount: Number(amount),
      status: (status as InvoiceStatus) ?? 'draft',
      created_by,
      created_at,
    }
  })
}

async function seedIfNeeded() {
  if (seeded.value) return
  const [usersRes, invoicesRes] = await Promise.all([
    fetch('/users.csv'),
    fetch('/invoices.csv'),
  ])
  users.value = parseUsersCsv(await usersRes.text())
  invoices.value = parseInvoicesCsv(await invoicesRes.text())
  // Default login: first employee (gives the most interesting ABAC demo)
  currentUser.value =
    users.value.find(u => u.role === 'employee') ?? users.value[0] ?? null
  seeded.value = true
}

function resetStore() {
  users.value = []
  invoices.value = []
  outbox.value = []
  currentUser.value = null
  lastReportMonth.value = null
  seeded.value = false
  return seedIfNeeded()
}

export type HandlerResult =
  | { ok: true; message: string; data?: unknown }
  | { ok: false; error: string }

// ─── Handlers ──────────────────────────────────────────────────────────
// Called AFTER both RBAC + ABAC layers have approved (in useAgent.ts).

function nextInvoiceId(): string {
  return String(invoices.value.reduce((m, i) => Math.max(m, Number(i.id) || 0), 0) + 1)
}

export function listInvoices(visibleIds: string[] | null): HandlerResult {
  const subset = visibleIds
    ? invoices.value.filter(i => visibleIds.includes(i.id))
    : invoices.value
  if (subset.length === 0) {
    return { ok: true, message: 'No invoices visible to you.', data: [] }
  }
  const summary = subset
    .slice(0, 8)
    .map(i => `#${i.id} ${i.customer} $${i.amount} [${i.status}]`)
    .join(', ')
  const more = subset.length > 8 ? ` (+${subset.length - 8} more)` : ''
  return {
    ok: true,
    message: `${subset.length} invoice(s): ${summary}${more}`,
    data: subset,
  }
}

export function createInvoice(args: { customer: string; amount: number }): HandlerResult {
  if (!currentUser.value) return { ok: false, error: 'No current user.' }
  const inv: Invoice = {
    id: nextInvoiceId(),
    customer: args.customer,
    amount: Number(args.amount),
    status: 'draft',
    created_by: currentUser.value.id,
    created_at: new Date().toISOString().slice(0, 10),
  }
  invoices.value.push(inv)
  return {
    ok: true,
    message: `Created invoice #${inv.id} for ${inv.customer} ($${inv.amount}, draft)`,
    data: inv,
  }
}

export function deleteInvoice(args: { id: string }): HandlerResult {
  const before = invoices.value.length
  invoices.value = invoices.value.filter(i => i.id !== args.id)
  if (invoices.value.length === before) return { ok: false, error: `Invoice ${args.id} not found.` }
  return { ok: true, message: `Deleted invoice #${args.id}` }
}

export function approveInvoice(args: { id: string }): HandlerResult {
  const idx = invoices.value.findIndex(i => i.id === args.id)
  if (idx < 0) return { ok: false, error: `Invoice ${args.id} not found.` }
  if (invoices.value[idx].status === 'paid') {
    return { ok: false, error: `Invoice ${args.id} is already paid.` }
  }
  invoices.value.splice(idx, 1, { ...invoices.value[idx], status: 'paid' })
  return { ok: true, message: `Invoice #${args.id} marked paid ✓` }
}

export function monthlyReport(args: { month?: string }): HandlerResult {
  if (!currentUser.value) return { ok: false, error: 'No current user.' }
  const month = args.month?.match(/^\d{4}-\d{2}$/)
    ? args.month
    : new Date().toISOString().slice(0, 7)
  const mine = invoices.value.filter(
    i => i.created_by === currentUser.value!.id && i.created_at.startsWith(month),
  )
  const total = mine.reduce((s, i) => s + i.amount, 0)
  const paid = mine.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const byStatus = mine.reduce<Record<string, number>>((acc, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1
    return acc
  }, {})

  lastReportMonth.value = month
  return {
    ok: true,
    message:
      `Report ${month} — ${mine.length} invoice(s), ` +
      `$${total.toLocaleString()} billed, $${paid.toLocaleString()} paid. ` +
      `By status: ${JSON.stringify(byStatus)}`,
    data: { month, count: mine.length, total, paid, by_status: byStatus, invoices: mine },
  }
}

export async function forwardReportToAccountant(args: { month?: string }): Promise<HandlerResult> {
  if (!currentUser.value) return { ok: false, error: 'No current user.' }
  const month = args.month ?? lastReportMonth.value ?? new Date().toISOString().slice(0, 7)
  const accountant = users.value.find(u => u.role === 'accountant')
  if (!accountant) return { ok: false, error: 'No accountant configured.' }

  const mine = invoices.value.filter(
    i => i.created_by === currentUser.value!.id && i.created_at.startsWith(month),
  )
  const total = mine.reduce((s, i) => s + i.amount, 0)
  const paid = mine.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const subject = `Monthly report — ${month} — ${currentUser.value.name}`
  const text =
    `Hi ${accountant.name.split(' ')[0]},\n\n` +
    `Forwarding my report for ${month}.\n\n` +
    `Invoices: ${mine.length}\nTotal billed: $${total.toLocaleString()}\nPaid: $${paid.toLocaleString()}\n\n` +
    `Cheers,\n${currentUser.value.name}`

  // Always log to the in-memory Outbox so the UI can show the email shape.
  outbox.value.push({ at: new Date().toISOString(), to: accountant.email, subject, body: text })

  // Best-effort real send via Resend (configured in vite.config.ts middleware).
  try {
    const r = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: accountant.email, subject, text }),
    })
    const data = await r.json()
    if (data.ok) {
      return {
        ok: true,
        message:
          `Report ${month} forwarded to ${accountant.name} <${accountant.email}> ` +
          `(real email sent → ${data.forwardedTo}, id ${data.id})`,
      }
    }
    return {
      ok: true,
      message: `Report ${month} queued in Outbox (Resend not configured: ${data.error})`,
    }
  } catch (err) {
    return {
      ok: true,
      message: `Report ${month} queued in Outbox (network error: ${err instanceof Error ? err.message : String(err)})`,
    }
  }
}

export function useStore() {
  onMounted(seedIfNeeded)
  return { users, invoices, outbox, currentUser, lastReportMonth, resetStore }
}
