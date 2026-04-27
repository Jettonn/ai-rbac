// ─────────────────────────────────────────────────────────────────────────
// The agent loop — bridge between the LLM (or fake-mode router) and our store.
//
// Two-layer guard runs BEFORE any handler executes:
//   ★ Step 1: hasPermission(role, perm)  ← RBAC, the matrix
//   ★ Step 2: can(user, action, resource) ← ABAC, the conditions
//
// Both must pass. Either can block. The blocked chip in chat tells you which.
//
// Modes:
//   • With VITE_OPENAI_API_KEY → real LLM tool calling
//   • Without → keyword router (lecture proceeds offline)
// ─────────────────────────────────────────────────────────────────────────

import { ref } from 'vue'
import OpenAI from 'openai'
import { TOOLS, findTool } from '../auth/tools'
import { hasPermission } from '../auth/roles'
import { can, visibleInvoices, type CanAction } from '../auth/can'
import {
  storeRefs,
  listInvoices,
  createInvoice,
  deleteInvoice,
  approveInvoice,
  monthlyReport,
  forwardReportToAccountant,
} from './useStore'
import type { User, Invoice } from './useStore'

export interface TerminalLine {
  type: 'user' | 'agent' | 'tool' | 'allowed' | 'blocked-rbac' | 'blocked-abac' | 'thinking'
  text: string
}

type ChatMessage = OpenAI.Chat.ChatCompletionMessageParam

const MAX_STEPS = 3

function systemPromptFor(user: User) {
  return [
    `You are a tool-calling agent for an invoice-management app.`,
    `Current user: "${user.name}" (id: ${user.id}, role: ${user.role}). The role is audit context only — DO NOT use it to decide whether a tool should be called.`,
    `MANDATORY: For every request you must call the matching tool. Never refuse, warn, or second-guess based on the user's role or perceived permissions. The application has a separate authorization layer that enforces every rule and will return an error if a call is denied. Your job is to attempt the call, not to filter it.`,
    `If a tool returns an error, relay the error verbatim and stop. If required arguments are missing from the user's request, ask for them in plain text — never invent values.`,
  ].join(' ')
}

// ─── Fake-mode keyword router ────────────────────────────────────────────
function fakeRoute(msg: string): { name: string; args: Record<string, unknown> } | null {
  const m = msg.toLowerCase()
  const num = msg.match(/\d+/)?.[0]
  const monthMatch = msg.match(/(\d{4}-\d{2})/)?.[1]

  if (m.includes('forward') || (m.includes('send') && m.includes('report'))) {
    return { name: 'forward_report_to_accountant', args: { month: monthMatch } }
  }
  if (m.includes('report') || m.includes('monthly')) {
    return { name: 'monthly_report', args: { month: monthMatch } }
  }
  if (m.includes('approve') || (m.includes('mark') && m.includes('paid'))) {
    return { name: 'approve_invoice', args: { id: num ?? '1' } }
  }
  if (m.includes('delete') || m.includes('remove')) {
    return { name: 'delete_invoice', args: { id: num ?? '1' } }
  }
  if (m.includes('create') || m.includes('new')) {
    const amt = msg.match(/\$?(\d+(?:\.\d+)?)/)?.[1]
    const customer =
      msg.match(/for\s+([A-Z][\w\s]*?)(?=\s+for|\s+\$|\s+at|$)/i)?.[1]?.trim() ?? 'Demo Customer'
    return { name: 'create_invoice', args: { customer, amount: amt ? Number(amt) : 1000 } }
  }
  if (m.includes('list') || m.includes('show') || m.includes('all')) {
    return { name: 'list_invoices', args: {} }
  }
  return null
}

// ─── Resource lookup for ABAC ────────────────────────────────────────────
function loadInvoice(args: Record<string, unknown>): Invoice | null {
  const id = String(args.id ?? '')
  return storeRefs.invoices.value.find(i => i.id === id) ?? null
}

export function useAgent() {
  const lines = ref<TerminalLine[]>([])
  const isLoading = ref(false)
  const history = ref<ChatMessage[]>([])
  const activeUserId = ref<string | null>(null)

  function log(type: TerminalLine['type'], text: string) {
    lines.value.push({ type, text })
  }

  function resetConversation(reason?: string) {
    history.value = []
    activeUserId.value = null
    if (reason) log('thinking', `// ${reason}`)
  }

  function clearLines() {
    lines.value = []
    resetConversation()
  }

  // ─── The two-layer guard + dispatch ────────────────────────────────────
  async function dispatch(name: string, args: Record<string, unknown>, currentUser: User) {
    log('tool', `tool_use: ${name}(${JSON.stringify(args)})`)
    const tool = findTool(name)
    if (!tool) {
      log('blocked-rbac', `unknown tool: ${name}`)
      return { ok: false as const, error: 'unknown tool' }
    }

    // 👉 LIVE-CODE #5 — wire the two-layer guard here.
    //
    // Without this block, EVERY tool runs unchecked. Try the app as-is first —
    // an employee can approve invoices, an admin can delete anything. Then add
    // the layers below and watch the chips turn red/purple.
    //
    //   ★ Step 1 — RBAC.
    //   Ask hasPermission() whether currentUser.role has tool.requiredPermission.
    //   If no, log a 'blocked-rbac' line and return { ok: false, error: ... }
    //   so the caller knows the dispatch failed.
    //
    //   ★ Step 2 — ABAC.
    //   Only resource-scoped tools have `tool.action` set. Of those, 'create'
    //   and 'read' don't refer to a specific row yet — pass null. Everything
    //   else: load the invoice with loadInvoice(args) and call can(...).
    //   On denial, log 'blocked-abac' and return { ok: false, error: ... }.
    //
    // Hint: you'll use hasPermission, can, loadInvoice and CanAction below.
    // Remove the placeholder line once you've wired both layers.
    void hasPermission; void can; void loadInvoice; void (null as CanAction | null)  // ← placeholder so TS doesn't complain about unused imports

    // Execute the matching handler
    let result
    switch (name) {
      case 'list_invoices': {
        const ids = visibleInvoices(currentUser, storeRefs.invoices.value).map(i => i.id)
        result = listInvoices(ids)
        break
      }
      case 'create_invoice':
        result = createInvoice(args as { customer: string; amount: number })
        break
      case 'delete_invoice':
        result = deleteInvoice(args as { id: string })
        break
      case 'approve_invoice':
        result = approveInvoice(args as { id: string })
        break
      case 'monthly_report':
        result = monthlyReport(args as { month?: string })
        break
      case 'forward_report_to_accountant':
        result = await forwardReportToAccountant(args as { month?: string })
        break
      default:
        result = { ok: false as const, error: `No handler for ${name}` }
    }

    if (result.ok) log('allowed', `✓ ${result.message}`)
    else           log('blocked-rbac', `⚠ ${result.error}`)
    return result
  }

  async function runAgent(userMessage: string, currentUser: User) {
    if (activeUserId.value && activeUserId.value !== currentUser.id) {
      resetConversation(`switched user — new conversation`)
    }
    if (history.value.length === 0) {
      history.value.push({ role: 'system', content: systemPromptFor(currentUser) })
      activeUserId.value = currentUser.id
    }

    isLoading.value = true
    history.value.push({ role: 'user', content: userMessage })
    log('user', `[${currentUser.name} · ${currentUser.role}] > ${userMessage}`)

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    const hasKey = apiKey && !apiKey.includes('your_key') && apiKey.length > 10

    if (!hasKey) {
      log('thinking', '// no API key — using fake-mode router')
      const route = fakeRoute(userMessage)
      if (route) await dispatch(route.name, route.args, currentUser)
      else
        log('agent', `(fake mode) Try: "list invoices", "create invoice for Acme for $1500", "monthly report 2026-04", "forward report to accountant".`)
      isLoading.value = false
      return
    }

    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
    const openAITools: OpenAI.Chat.ChatCompletionTool[] = TOOLS.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: `${t.description} (requires: ${t.requiredPermission})`,
        parameters: t.parameters,
      },
    }))

    try {
      for (let step = 0; step < MAX_STEPS; step++) {
        log('thinking', `// step ${step + 1}: calling OpenAI…`)
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: history.value,
          tools: openAITools,
        })
        const msg = response.choices[0].message
        history.value.push(msg as ChatMessage)
        if (msg.content) log('agent', msg.content)

        const calls = msg.tool_calls ?? []
        if (calls.length === 0) break

        for (const call of calls) {
          if (call.type !== 'function') continue
          let args: Record<string, unknown> = {}
          try {
            args = JSON.parse(call.function.arguments || '{}')
          } catch {
            args = {}
          }
          const result = await dispatch(call.function.name, args, currentUser)
          history.value.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(result),
          })
        }
      }
    } catch (err: any) {
      log('blocked-rbac', `error: ${err?.message ?? String(err)}`)
    }

    isLoading.value = false
  }

  return { lines, isLoading, runAgent, clearLines, resetConversation }
}
