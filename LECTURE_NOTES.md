# 🎤 Lecture Notes — RBAC + ABAC + AI Agent

> **Printo këtë në A4 dhe mbaje pranë vetes gjatë ligjëratës.**
> Format: çdo seksion = një faqe ≈ 5–10 min ligjëratë.
>
> Konverto në PDF: `pandoc LECTURE_NOTES.md -o lecture-notes.pdf` ose Print to PDF nga browser-i / VS Code.

---

## 🔧 Para ligjëratës — checklist

- [ ] `git pull` në repo-në `ai-rbac-lecture`
- [ ] `pnpm install` ka mbaruar (mos prit live)
- [ ] `.env` ka `VITE_OPENAI_API_KEY`, `RESEND_API_KEY`, `FORWARD_TO=jetonkorenica@gmail.com`
- [ ] Krijo një **yopass** për OpenAI key: https://yopass.se → 1 ditë expiration → kopjo URL
- [ ] `git checkout main` (pozicioni fillestar)
- [ ] `pnpm dev` boots http://localhost:5173 — provo një herë me Alice
- [ ] `git checkout solved && pnpm dev` — provo që funksionon (rezervë)
- [ ] `git checkout main` (kthehu)
- [ ] Marp server: `pnpm slides` → http://localhost:8080/SLIDES.sq.md
- [ ] Browser-i i zoom-uar (Cmd/Ctrl +)
- [ ] Editor-i i zoom-uar ≥ 18pt
- [ ] Email-i i ngarkuar — për të verifikuar real-time se Resend dërgon
- [ ] Shishe uji
- [ ] Zero Slack/njoftime

---

## 💬 Fjalët magjike (përsërit gjatë ligjëratës)

- *"LLM-ja propozon. Kodi yt vendos."* — pas çdo demo
- *"Autorizimi jeton në kod, jo në prompt."* — sllajdi i parimit
- *"Dy rreshta kodi. Kaq."* — kur tregon `hasPermission`
- *"Shto një rresht. Ke një rol të ri."* — kur tregon matricën
- *"RBAC për 90%-in. ABAC për 10%-in që ka kushte."* — para `can()` slide

---

## ⏱ Time budget (60 min)

| Min | Phase | Sllajdet |
|:-:|---|:-:|
| 0–3 | Welcome + agenda | 1–2 |
| 3–8 | **§1** AuthN vs AuthZ | 3–6 |
| 8–14 | **§2** Project Overview + live demo (`pnpm dev`) | 7–11 |
| 14–18 | **§3a** RBAC concept (matrix + guard) | 12–16 |
| 18–28 | **§3b** ☕ Live coding · RBAC | 17 + editor |
| 28–32 | **§4** Where RBAC breaks | 18–20 |
| 32–35 | **§5a** ABAC concept (`can()`) | 21–23 |
| 35–43 | **§5b** ☕ Live coding · ABAC | 24 + editor |
| 43–46 | **§6a** AI Tools concept | 25–27 |
| 46–53 | **§6b** ☕ Live coding · AI Tools + monthly report demo | 28 + editor |
| 53–56 | **§7** Choosing the right model | 29 |
| 56–60 | Wrap + Q&A | 30–32 |

---

# 📍 Section 1 — AuthN vs AuthZ (3–8 min)

## Sllajdi 3 — *Section divider*

**Thuaj** (15 sek): *"Para se të hyjmë te lejet, dy fjalë që ngatërrohen."*

## Sllajdi 4 — *AuthN vs AuthZ table*

**Thuaj** (60 sek):
- "🔐 **Autentikimi** — kush je. Login, password, JWT, OAuth. Provon **identitetin**."
- "🛂 **Autorizimi** — çfarë mund të bësh. Rolet, lejet. Provon **të drejtat**."
- "Sot fokusi është te i dyti. Supozojmë se login-i është bërë."

## Sllajdi 5 — *Pse rëndon dallimi*

**Thuaj** (45 sek):
- *"Autentikim i dobët → çdokush mund të jetë çdokush."*
- *"Autorizim i dobët → çdokush mund të bëjë çdo gjë."*

## Sllajdi 6 — *Pse rëndon edhe më shumë me AI*

**Thuaj** (60 sek):
- "Te API klasik, një **person** dërgon kërkesën — verifikon rolin e tij."
- "Te agjent AI, **modeli** zgjedh veprimin. Mund të zgjedhë gjithçka që sheh."
- "Modeli i njëjtë. Pasoja më të mëdha."

[**PAUSA 3 sek**]

---

# 📍 Section 2 — Project Overview (8–14 min)

## Sllajdi 7 — *Section divider*

## Sllajdi 8 — *Aktorët + të dhënat*

**Thuaj** (45 sek):
- "Aplikacion menaxhimi faturash. 10 përdorues, ~50 fatura, 3 muaj historie."
- "**Sarah Chen** = admin. **Daniel Schmidt** + **Amelia Owens** = accountants. Të tjerët = employees."

## Sllajdi 9 — *Live demo*

🎬 **Veprime**: Hap http://localhost:5173 — login default si Alice. Trego sidebarin **6/50 fatura**.

**Thuaj** (60 sek):
- "Alice (employee) sheh vetëm faturat e veta — 6 nga 50."
- Switch te **Daniel** → 50/50 me drafts.
- Switch te **Sarah** → 50/50 me kontrolle të plota... por ka një gjë që as ajo s'mund ta bëjë.

## Sllajdi 10 — *Stack*

**Thuaj** (30 sek):
- Vue 3 + Vite + Tailwind v4 + OpenAI SDK. Pa monorepo, pa backend, pa databazë.

## Sllajdi 11 — *Repo layout*

**Thuaj** (45 sek):
- "Sot do të prekim **vetëm dy gjëra**: `src/auth/` dhe `useAgent.ts`."
- *"Çdo gjë tjetër është gati."*

---

# 📍 Section 3a — RBAC concept (14–18 min)

## Sllajdi 12 — *Section divider*

## Sllajdi 13 — *Ideja që duket e mirë*

**Thuaj** (60 sek):
- "Ideja e parë që vjen në mendje: t'i them LLM-së në prompt: 'mos fshij'."
- Trego ekzemplin e prompt injection.
- *"Kjo është teatër sigurie."*

## Sllajdi 14 — *Parimi*

[**PAUSA 5 sek**]
- *"**Autorizimi jeton në kod, jo në prompt.**"*

## Sllajdi 15 — *RBAC tre koncepte*

- Rol · Leje · Matricë.

## Sllajdi 16 — *Matrica + Guard-i (kod)*

- Trego sllajdin me kodin nga `solved`.
- *"Dy rreshta. Kaq."*

---

# 📍 Section 3b — ☕ Live coding · RBAC (18–28 min)

## Sllajdi 17 — *transition slide*

🎬 **Veprime**:
1. Editor: hap `src/auth/roles.ts` (përdor `Cmd+P`)
2. Browser: hap http://localhost:5173 paralel

### ✏️ TODO #1 — `src/auth/roles.ts` rresht 22

Para:
```ts
export type Permission = string
```

Pas:
```ts
export type Permission =
  | 'read:invoices'
  | 'create:invoices'
  | 'delete:invoices'
  | 'approve:invoices'
  | 'read:users'
  | 'manage:users'
```

**Thuaj**: *"Një tip Permission është thjesht një union stringjesh. Kjo është 'verbi:emri'."*

### ✏️ TODO #2 — `src/auth/roles.ts` rresht 27

Para:
```ts
export const ALL_PERMISSIONS: Permission[] = []
```

Pas:
```ts
export const ALL_PERMISSIONS: Permission[] = [
  'read:invoices',
  'create:invoices',
  'delete:invoices',
  'approve:invoices',
  'read:users',
  'manage:users',
]
```

🎯 **Ruaj. Trego browserin.** Badge-et duken (të gjitha të kuqe ende, sepse ROLE_PERMISSIONS s'është mbushur).

### ✏️ TODO #3 — `src/auth/roles.ts` rresht 36

Para:
```ts
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [],
  accountant: [],
  employee: [],
}
```

Pas:
```ts
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'read:invoices', 'create:invoices', 'delete:invoices',
    'approve:invoices', 'read:users', 'manage:users',
  ],
  accountant: [
    'read:invoices', 'create:invoices', 'delete:invoices',
    'approve:invoices', 'read:users',
  ],
  employee: [
    'read:invoices', 'create:invoices', 'delete:invoices',
  ],
}
```

🎯 **Ruaj. Browser:** Sarah ka 6 jeshile, Daniel 5, Alice 3. Switch role — badge-et ndryshojnë.

💬 **Pyetje për klasën**: *"Po nëse doni t'i jepni accountant-it manage:users, çfarë ndryshoni?"*

### ✏️ TODO #3 (the guard) — `src/auth/roles.ts` rresht 49

Para:
```ts
export function hasPermission(_role: Role, _perm: Permission): boolean {
  return false
}
```

Pas:
```ts
export function hasPermission(role: Role, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(perm)
}
```

[**PAUSA 5 sek**]
**Thuaj**: *"Ky funksion është thelbi i gjithë sistemit. Dy rreshta."*

### ✏️ TODO #5 — `src/composables/useAgent.ts` rresht 116

Hap dispatch-in. Tregoju komentin e plotë me Step 1 + Step 2.<br>
**Sa për tani**, plotëso vetëm hapin RBAC. ABAC do të vijë në §5.

Fshi:
```ts
void hasPermission; void can; void loadInvoice; void (null as CanAction | null)
```

Vendos:
```ts
// ★ Step 1 — RBAC
if (!hasPermission(currentUser.role, tool.requiredPermission)) {
  log('blocked-rbac', `RBAC: "${currentUser.role}" lacks "${tool.requiredPermission}"`)
  return { ok: false as const, error: `RBAC denied: ${tool.requiredPermission}` }
}
```

🎯 **Demo**: Login si **Alice (employee)** → kliko *"Approve invoice 31"* → 🔒 **chip i kuq RBAC**.<br>
*"Employees nuk kanë `approve:invoices`. Roja qëndron."*

---

# 📍 Section 4 — Where RBAC breaks (28–32 min)

## Sllajdi 18 — *A shkallëzohet*

**Thuaj** (30 sek): *"Matrica rritet. Kodi jo. Kontrolli mbetet O(1)."*

## Sllajdi 19 — *Ku RBAC thyhet*

**Thuaj** (60 sek):
- *"Vetëm përdoruesi që ka krijuar faturën mund ta fshijë."*
- "Fjala 'që ka krijuar' nuk është rol — është kusht mbi resursin."
- "RBAC nuk e shpreh dot. Edhe Sarah do të mund të fshinte gjithçka."

## Sllajdi 20 — *Kurthi: shpërthimi i roleve*

**Thuaj** (45 sek):
- "Njerëzit përpiqen ta shtrijnë RBAC. Kthehet në 'editor-team-a-business-hours-EU'..."
- *"Të duhet diçka tjetër."*

---

# 📍 Section 5a — ABAC concept (32–35 min)

## Sllajdi 21 — *Section divider*

## Sllajdi 22 — *Tre lloje atributesh*

**Thuaj** (45 sek): Subjekt + Resurs + Kontekst.

## Sllajdi 23 — *`can()` kodi*

Tregoji kodin e plotë nga slajdet. *"Tani do ta shkruajmë vetë."*

---

# 📍 Section 5b — ☕ Live coding · ABAC (35–43 min)

## Sllajdi 24 — *transition*

### ✏️ TODO #4 — `src/auth/can.ts` rresht 60

Hap `src/auth/can.ts`. Tregoji komentet me hapat.

Para:
```ts
export function can(_user: User, _action: CanAction, _invoice: Invoice | null): boolean {
  void hasPermission; void ACTION_PERMISSION
  return false
}
```

Pas:
```ts
export function can(user: User, action: CanAction, invoice: Invoice | null): boolean {
  // Step 1 — RBAC base check
  if (!hasPermission(user.role, ACTION_PERMISSION[action])) return false
  if (!invoice) return true

  // Step 2 — ABAC conditions

  // Strict ownership on delete — even admin
  if (action === 'delete') {
    return invoice.created_by === user.id
  }

  // Update — creator, or admin overrides
  if (action === 'update') {
    return user.role === 'admin' || invoice.created_by === user.id
  }

  // Read — employees see only their own
  if (action === 'read') {
    if (user.role === 'employee') return invoice.created_by === user.id
    return true
  }

  // Create + approve — RBAC alone is enough
  return true
}
```

### ✏️ TODO #5 (continue) — `src/composables/useAgent.ts` rresht ~125

Tani plotëso edhe hapin ABAC. Pas blokut RBAC që shtove më parë:

```ts
// ★ Step 2 — ABAC
if (tool.action) {
  const resource = tool.action === 'create' || tool.action === 'read'
    ? null
    : loadInvoice(args)
  if (resource && !can(currentUser, tool.action as CanAction, resource)) {
    log('blocked-abac', `ABAC: ${currentUser.name} cannot ${tool.action} this Invoice`)
    return { ok: false as const, error: `ABAC denied: not your resource.` }
  }
}
```

🎯 **Demo i fortë**:
1. Switch te **Sarah (admin)**
2. Type në chat: *"delete invoice 9"* (e Hassan-it)
3. **Chip i purpurt 🛡 ABAC**: *"Sarah Chen cannot delete this Invoice"*

[**PAUSA**]
**Thuaj**: *"Edhe admin-i nuk e kapërcen ownership-in. Strict creator-only. Ky është rregulli."*

💬 **Pyetje**: *"Po sikur Alice (employee) të provojë të lexojë faturën e Ben-it?"* — bllokuar nga ABAC, jo nga sidebari sepse ai filtrohet automatikisht.

---

# 📍 Section 6a — AI Tools concept (43–46 min)

## Sllajdi 25 — *Si i sheh LLM-ja "tools"*

**Thuaj** (60 sek):
- "Agjenti **nuk vepron** drejtpërdrejt mbi databazën. Ai vetëm thotë çfarë do."
- "Ne i japim listën e mjeteve si JSON Schema. Modeli na kthen { name, args }. Ne ekzekutojmë (pas guard-it)."

## Sllajdi 26 — *Anatomia e një mjeti*

**Thuaj** (45 sek):
- "LLM-ja sheh: name + description + parameters."
- "LLM-ja **nuk** sheh: requiredPermission, action."
- *"Kjo është arsyeja pse prompt injection nuk mund ta bypass-ojë."*

## Sllajdi 27 — *Two-layer guard*

Tregoji guardin kompletë (RBAC + ABAC).

---

# 📍 Section 6b — ☕ Live coding · AI Tools (46–53 min)

## Sllajdi 28 — *transition*

### ✏️ TODO #6 — `src/auth/tools.ts` rresht 78

Hap `src/auth/tools.ts`. Tregoji komentin me dy mjetet.

Vendos brenda array-it `TOOLS`:

```ts
{
  name: 'monthly_report',
  description:
    'Aggregate the current user\'s own invoices for a given month. ' +
    'Returns total billed, total paid, count by status.',
  requiredPermission: 'read:invoices',
  action: 'read',
  parameters: {
    type: 'object',
    properties: {
      month: { type: 'string', description: 'YYYY-MM. Defaults to current.' },
    },
    required: [],
  },
},
{
  name: 'forward_report_to_accountant',
  description:
    'Forward the most recent monthly_report result to an accountant. ' +
    'Logged to the Outbox panel.',
  requiredPermission: 'read:invoices',
  parameters: {
    type: 'object',
    properties: {
      month: { type: 'string', description: 'YYYY-MM month covered.' },
    },
    required: [],
  },
},
```

🎯 **Demo me ndikim** (1 min):
1. Login si **Alice (employee)**
2. *"monthly report 2026-03"* → ✓ chip me totalin
3. *"forward report to accountant"* → ✓ chip + **Outbox panel: 1 email**
4. **Hap inbox-in tënd në telefon ose në një tab tjetër** — tregoji klasës që email-i ka mbërritur te `jetonkorenica@gmail.com` real-time (përmes Resend).

[**PAUSA**]
**Thuaj**: *"Pse Alice s'mund të shohë faturat e Ben-it në raport? Sepse `can('read', 'Invoice', { created_by: alice.id })` është rregulli. ABAC filtroi automatikisht."*

---

# 📍 Section 7 — Choosing the right model (53–56 min)

## Sllajdi 29 — *Choose right*

**Thuaj** (90 sek):
1. **Fillo me RBAC.** Gjithmonë.
2. Shto ABAC vetëm kur shfaqet *"e veta"*, *"nën"*, *"gjatë"*.
3. **Shtreso** ABAC mbi RBAC, mos e zëvendëso.
4. Nëse rregullat kalojnë 50, kalo te bibliotekë (CASL, OPA, Cedar).
5. Asnjëherë mos e vendos rregullin **në prompt**.

> *"RBAC i mërzitshëm > ABAC i sofistikuar i prishur."*

---

# 📍 Wrap-up (56–60 min)

## Sllajdi 30 — *Çfarë ndërtuam*

**Thuaj** (30 sek):
- "3 role × 6 leje × 6 mjete · dy guard-e · agjent AI që respekton të dyja."
- "~50 rreshta që ne shkruam së bashku."

## Sllajdi 31 — *Pyetje + resources*

[**PAUSA 5–10 sek për pyetje**]

Nëse askush s'pyet: *"Një pyetje që e kisha unë: po sikur LLM-ja të halucinojë emrin e mjetit?"* → `findTool()` kthen undefined → bllokohet.

## Sllajdi 32 — *Homework*

Shto rolin **`auditor`**: read all invoices, no modify, no delete. PR.

---

# 🆘 Plan për panik

| Problem | Zgjidhja |
|---|---|
| Kodi nuk kompilohet | `git checkout solved` — vazhdo nga aty |
| LLM kthen 429 | Fake-mode router e mbulon — vazhdo |
| Email s'vjen | Outbox panel prapë e tregon — *"Resend duket i ngadaltë sot"* |
| Klasa po humb | Switch role para tyre — bën RBAC të prekshëm |
| Pyetje që s'e di | *"Pyetje e mirë. Do ta verifikoj dhe do t'ju dërgoj me email."* |

---

# 🔑 Files to remember

| Spot | File:line |
|---|---|
| TODO #1 (Permission union) | `src/auth/roles.ts:22` |
| TODO #2 (ALL_PERMISSIONS) | `src/auth/roles.ts:27` |
| TODO #3 (matrix + guard) | `src/auth/roles.ts:36`, `src/auth/roles.ts:49` |
| TODO #4 (`can()` ABAC) | `src/auth/can.ts:60` |
| TODO #5 (guard wiring) | `src/composables/useAgent.ts:116` |
| TODO #6 (two tools) | `src/auth/tools.ts:78` |

Quick search: `grep -rn "LIVE-CODE" src/`

---

# 🎤 Final thoughts

- **Mos lexo këtë.** Bisedo me ta.
- **Përdor pauza.** Heshtja është e fuqishme.
- **Switch role** sa më shpesh — bën abstraksionet të prekshme.
- **Argëtohu.** Nëse ti argëtohesh, argëtohen edhe ata.

**Suksese!** 🚀
