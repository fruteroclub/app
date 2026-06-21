# AGENTS.md — code/club-app

Portable, tool-agnostic context for any coding agent (Claude Code, Codex, Cursor,
Hermes, …) working **inside the application codebase**. For project identity and
internOS conventions, see the parent [`../../AGENTS.md`](../../AGENTS.md),
[`../../PROJECT.md`](../../PROJECT.md), and [`../../DESIGN.md`](../../DESIGN.md).

## What this is

The web app behind **Frutero Club**: the public marketing site at
**https://frutero.club** plus the authenticated member app. One Next.js App
Router project, two route groups, off-chain identity only.

- `(marketing)` — public, **force-static**, **paper-only** (no MODO toggle).
- `(app)` — authenticated (Privy), dynamic, the only place arcade mode lives.

The onchain twin / reputation scoring / graduation are **out of scope here** —
this codebase is the off-chain identity + marketing foundation the product plan
layers onto later.

## Hard rules (non-negotiable — match the build brief)

1. **Public is paper-only.** No MODO toggle on marketing pages. Arcade mode is
   `(app)`-only.
2. **Vocabulary.** Public term is **"perfil"**; "twin" is internal only. Never
   say **onchain / web3 / crypto / blockchain** in marketing copy — lead with
   **"verifiable" / "verificable"**. This is enforced by tests
   (`components/marketing/__tests__/landing.test.tsx`, `tests/e2e/landing.spec.ts`).
3. **No onchain anything.** No wagmi/viem/contracts/tokens. Off-chain identity
   only (Privy auth + Postgres profile).
4. **Leads persist to the DB** (`leads` table) **and** email via Resend. The DB
   is the system of record; email is best-effort. Honeypot is the real spam
   defense.
5. **No silent failures.** Every failure mode has a user-visible outcome (see the
   failure-mode table in `../../docs/plans/landing-implementation-plan.md` and the
   route tests).
6. **Locales:** next-intl `localePrefix: 'as-needed'`. `frutero.club/` = Spanish
   (clean apex, no prefix); `/en` = English; `/es/...` 308-canonicalizes to bare.

## Stack

Next 16 (App Router, Turbopack) · React 19.2 · TypeScript 5 · Tailwind v4 ·
next-intl 4 · `@privy-io/react-auth` 3 + `@privy-io/server-auth` (auth + embedded
wallet) · drizzle-orm 0.45 + `postgres` (Neon serverless) · zod 4 · Resend ·
fonts via `next/font/google` (Bitter / Geist / IBM Plex Mono always; Petrona lazy,
editorial routes only). Tests: Vitest + React Testing Library, Playwright, axe.
**No** wagmi/viem/contracts.

## Layout

```
code/club-app/
  app/[locale]/
    (marketing)/ layout.tsx page.tsx enterprise/page.tsx   # force-static
    (app)/ layout.tsx perfil/{page,edit}                   # authed (Privy)
    (design)/design/page.tsx                               # primitive showcase
  app/api/{contact,profile}/route.ts                       # leads / perfil
  app/{layout,sitemap,robots,opengraph-image}.tsx  middleware.ts
  components/{ui,marketing,app,analytics}/*  components/Glyph.tsx
  content/{landing,enterprise}.ts                          # typed structured data
  messages/{es,en}/<namespace>.json                        # per-namespace copy
  i18n/{routing,request,navigation}.ts                     # next-intl wiring
  lib/{db,auth,email,rate-limit,seo,analytics,fonts}.ts  lib/{api,validators}/*
  drizzle/                                                  # SQL migrations
  styles/globals.css                                       # paper + arcade tokens
  tests/e2e/*.spec.ts                                      # Playwright + axe
  *.test.ts(x)                                             # Vitest unit, co-located
```

## Build / run / test

```bash
bun install                 # full stack (already installed by the scaffold task)

bun run dev                 # local dev server
bun run build               # production build (Turbopack) — the CI gate
bun run start               # serve the production build

bun run lint                # eslint (next config)
bun run format / :check     # prettier (+ tailwind plugin)

bun run test                # Vitest unit + integration (jsdom + RTL). 116 tests.
bun run test:watch          # Vitest watch
bun run test:e2e            # Playwright e2e + axe (see "E2E" below)
```

### Database (Drizzle, migration-based — never `db:push`)

```bash
bun run db:generate         # author a migration from schema changes
bun run db:migrate          # apply migrations (uses DATABASE_URL_UNPOOLED)
bun run db:check            # verify migration integrity
bun run db:studio           # drizzle studio
```

Migrations run against the **unpooled** direct connection; the app queries the
**pooled** one (`DATABASE_URL`). `db:push` is banned — it corrupts migration
tracking (mirrors the `frutero-current-app` rule). Edit `lib/db/schema.ts`, then
`db:generate` + commit the SQL under `drizzle/`.

### Environment

Copy `.env.example` → `.env.local` and fill it. Envs and what they gate:

| Var | Gates | Notes |
|---|---|---|
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | profile + leads persistence, migrations | Neon. App=pooled, migrate=unpooled. |
| `NEXT_PUBLIC_PRIVY_APP_ID` / `PRIVY_APP_SECRET` | auth + `/api/profile` token verify | Privy app. |
| `RESEND_API_KEY` / `RESEND_FROM` / `CONTACT_FALLBACK_EMAIL` | lead notification email + 502 fallback addr | Resend. Verify the domain EARLY. |
| `NEXT_PUBLIC_SITE_URL` | canonical/hreflang/OG | `https://frutero.club`. |

Code paths fail loud on missing envs (`lib/db/client.ts` throws a clear message;
`lib/auth.ts` raises `PrivyConfigError`). The build itself needs no secrets.

## Tests — what's covered (risk-weighted, per the plan)

- **Auth/profile (high):** `app/api/profile/route.test.ts` — 201 create, 200
  idempotent update, **409 dup handle** (PG 23505), **401 bad/missing token**,
  400 invalid body, 500 Privy misconfig, 502 DB down, GET 200/404/401.
  `lib/auth.test.ts` — Privy verify (mocked), Bearer parsing, config error.
- **Contact (high):** `app/api/contact/route.test.ts` — 201 insert+email, 200
  when email fails after insert (lead saved), 400 validation, **honeypot**
  pretend-success/no-insert, **429 rate-limit**, **502 DB down + fallback email**.
  `lib/{email,rate-limit}.test.ts`, `lib/validators/contact.test.ts`.
- **i18n/routing (high):** `i18n/messages.test.ts` — **missing-key parity guard**
  (every namespace exposes identical leaf key-paths in es+en; no empty strings).
  `middleware.test.ts` — `/es`→bare 308 canonicalization, query preservation,
  `/esp` is not treated as `/es`, `/` and `/en` delegate to next-intl.
- **Design system (lighter):** `components/ui/__tests__/*` (Button press, Badge,
  ProgressBar clamp), `components/__tests__/glyph.test.tsx`.
- **Landing (RTL):** `components/marketing/__tests__/landing.test.tsx` — ES+EN
  render, CTA→`/perfil`, paper-only (no MODO), proof numbers flagged not faked,
  vocabulary guard.
- **E2E + a11y (Playwright):** `tests/e2e/*` — see below.

### E2E (Playwright + axe)

`playwright.config.ts` builds and serves the real app (`webServer`), or runs
against `E2E_BASE_URL` (e.g. a Vercel preview) when set. Specs:

- `landing.spec.ts` — ES apex (no prefix), `/en`, CTA→`/perfil`, paper-only,
  `/es`→bare redirect, rendered-HTML vocabulary guard.
- `enterprise.spec.ts` — services-led page, single contact island, contact
  **error paths run with no creds**; the happy-path lead insert is gated.
- `signup.spec.ts` — signup entry point (CTA→`/perfil`→login) creds-free; the
  full Privy login→create flow is gated.
- `a11y.spec.ts` — axe on landing/enterprise/perfil (**0 serious/critical**),
  colour-contrast on accent text, keyboard + focus-visible.

Credential-gated specs (`@needs-creds`) `test.skip(...)` with a visible reason
when Privy / `DATABASE_URL` are absent (`tests/e2e/_env.ts`) — a visible skip,
never a silent pass. Install the browser binary once with
`bunx playwright install chromium` before the first run.

## Copy-edit flow (`messages/`)

Copy is split **per namespace** under `messages/{locale}/<ns>.json` (so parallel
work owns disjoint files): `common`, `landing`, `enterprise`, `app`, `perfil`.
The list lives in `i18n/request.ts` (`NAMESPACES`) — add a namespace there when
you introduce a new file.

To change wording:

1. Edit `messages/es/<ns>.json` **and** `messages/en/<ns>.json` together — both
   locales must carry the same key-paths.
2. `bun run test` — the parity guard (`i18n/messages.test.ts`) fails if a key is
   added to one locale but not the other, or if any value is an empty string.
3. Open a PR. The **copy owner is GTM** (per the plan's D-content decision); copy
   changes ship by PR, not via a CMS.

Structured (non-string) landing data lives in typed `content/{landing,enterprise}.ts`,
not in messages. Operator-supplied proof numbers/clients are flagged placeholders
(`data-proof-pending`) and must NOT ship as invented figures (credibility surface).
