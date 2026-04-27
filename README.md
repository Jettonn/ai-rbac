# AI Agent · RBAC + ABAC

A small Vue + TypeScript app where an AI agent acts on a database of **invoices**. The agent can only do what each role + ownership rules allow — even with a deliberate prompt-injection attempt.

By the end of this lecture you'll have **written the access-control core yourself**: roles, permissions, the matrix, the guard, and tool definitions.

---

## Quick start

```bash
git clone https://github.com/Jettonn/ai-rbac.git
cd ai-rbac
pnpm install
cp .env.example .env
pnpm dev                   # → http://localhost:5173
```

The app boots immediately. A **fake-mode router** dispatches tools by keyword when no API key is set — so you can follow the entire lecture even offline.

---

## OpenAI API key (optional)

You can do the whole lecture without one — fake-mode covers every action. But if you want the agent to actually reason about your free-form requests, paste a key into `.env`:

```env
VITE_OPENAI_API_KEY=sk-proj-...
```

The lecturer will share a one-time temporary key via [yopass.se](https://yopass.se) at the start of the lecture. Paste it into `.env` and the LLM lights up.

---

## Email forwarding (optional, for the report demo)

The `forward_report_to_accountant` tool can either:

- **Just log to the Outbox panel** (default — no setup)
- **Actually email the report** via [Resend](https://resend.com) — free tier is plenty

To enable real email, add to `.env`:

```env
RESEND_API_KEY=re_...
FORWARD_TO=your-email@example.com    # optional override of the recipient
```

Then `pnpm dev` automatically picks it up. The lecturer's instance will forward to their inbox during the demo so the class can see the email arrive.

---

## What you'll write

Six numbered spots in three files. Search the codebase for `LIVE-CODE` to find them:

- `src/auth/roles.ts` — Permission union, ROLE_PERMISSIONS matrix, hasPermission
- `src/auth/can.ts` — the ABAC layer (`can()` function)
- `src/auth/tools.ts` — two tool definitions (`monthly_report`, `forward_report_to_accountant`)
- `src/composables/useAgent.ts` — wire the guard into the agent loop

**Total student-written code: ~50 lines.** Everything else is pre-built so you can focus on the access-control logic.

---

## Try it as different users

Top-right of the header, switch between:

- **Sarah Chen** (admin) — sees everything, but cannot delete other people's invoices
- **Daniel / Amelia** (accountant) — see all invoices including drafts, can approve
- **Alice / Ben / David / Elena / Grace / Hassan / Iva** (employee) — see only their own

Then ask the agent to *"list invoices"*, *"create an invoice for Acme for $1500"*, *"monthly report 2026-03"*, *"forward report to accountant"*, etc.

---

## Tech

- Vue 3 + TypeScript + Vite
- Tailwind CSS v4 (zero config — single `@import 'tailwindcss'`)
- OpenAI SDK for tool-calling (with offline fallback)
- Resend (optional, for the email forward demo)
- Light theme by default, dark mode toggle in the header

---

## Permission model

| Permission         | admin | accountant | employee |
|--------------------|:-----:|:----------:|:--------:|
| read:invoices      | ✓     | ✓          | ✓ (own)  |
| create:invoices    | ✓     | ✓          | ✓        |
| delete:invoices    | ✓ *   | ✓ *        | ✓ *      |
| approve:invoices   | ✓     | ✓          |          |
| read:users         | ✓     | ✓          |          |
| manage:users       | ✓     |            |          |

**\*** means *"creator-only"* — even admin cannot delete invoices they didn't create. That's the ABAC layer doing its job.

---

## Branches

- **`main`** — starter you clone for the lecture. Has 6 `LIVE-CODE` spots to fill in together.
- **`solved`** — same app with everything filled in. `git checkout solved` if you fall behind.

---

## License

Built for a guest lecture. Fork it, extend it, use it however you like.
