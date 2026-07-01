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
   say **onchain / web3 / crypto** in marketing copy — lead with **"verifiable" /
   "verificable"**. **"Blockchain" is allowed** — it's a technology and we're
   tech-forward (titles, articles, event names); keep crypto-_bro_/scam framing
   out, not the tech word. Enforced by tests
   (`components/marketing/__tests__/landing.test.tsx`, `tests/e2e/landing.spec.ts`).
3. **No onchain anything.** No wagmi/viem/contracts/tokens. Off-chain identity
   only (Privy auth + Convex profiles/leads).
4. **Convex first.** Profiles, dashboard bounties, and enterprise leads persist
   in Convex. Do not add backend/API route handlers or a relational database
   unless there is a concrete product need.
5. **No silent failures.** Every failure mode has a user-visible outcome (see the
   failure-mode table in `../../docs/plans/landing-implementation-plan.md` and
   current client/Convex tests).
6. **Locales:** next-intl `localePrefix: 'as-needed'`. `frutero.club/` = Spanish
   (clean apex, no prefix); `/en` = English; `/es/...` 308-canonicalizes to bare.

## Stack

Next 16 (App Router, Turbopack) · React 19.2 · TypeScript 5 · Tailwind v4 ·
next-intl 4 · `@privy-io/react-auth` 3 (auth + embedded wallet) · Convex
(profiles, dashboard bounties, leads) ·
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
  app/{layout,sitemap,robots,opengraph-image}.tsx  middleware.ts
  components/{ui,marketing,app,analytics}/*  components/Glyph.tsx
  convex/{schema,clubApp}.ts                               # profiles / leads
  content/{landing,enterprise}.ts                          # typed structured data
  messages/{es,en}/<namespace>.json                        # per-namespace copy
  i18n/{routing,request,navigation}.ts                     # next-intl wiring
  lib/{seo,analytics,fonts,member}.ts
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

bun run test                # Vitest unit + integration (jsdom + RTL).
bun run test:watch          # Vitest watch
bun run test:e2e            # Playwright e2e + axe (see "E2E" below)
```

### Convex

```bash
bunx convex dev             # local/dev Convex codegen + function sync
```

Convex is the launch backend. Add fields/tables in `convex/schema.ts` and
queries/mutations in `convex/clubApp.ts`.

### Environment

Copy `.env.example` → `.env.local` and fill it. Envs and what they gate:

| Var                                                         | Gates                                           | Notes                                                               |
| ----------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_PRIVY_APP_ID`                                  | login + embedded wallet creation                | Privy app.                                                          |
| `CONVEX_DEPLOYMENT` / `NEXT_PUBLIC_CONVEX_URL`              | profile, dashboard bounty, and lead persistence | Convex dev/prod deployment.                                         |
| `RESEND_API_KEY` / `RESEND_FROM` / `CONTACT_FALLBACK_EMAIL` | best-effort lead emails                         | Configure in Convex. Sends an internal notification to `CONTACT_FALLBACK_EMAIL` (defaults to `hola@frutero.club`) and a confirmation to the lead. |
| `NEXT_PUBLIC_SITE_URL`                                      | canonical/hreflang/OG                           | `https://frutero.club`.                                             |

The build itself needs no private secrets.

## Tests — what's covered (risk-weighted, per the plan)

- **Auth/profile (high):** profile creation/editing and dashboard bounty saves
  go through `convex/clubApp.ts` (`getProfile`, `saveProfile`, `saveBounty`).
- **Contact (high):** `components/marketing/ContactForm.tsx` validates inline
  and writes to Convex via `submitLead`; valid leads schedule best-effort
  Resend emails: one notification for `hola@frutero.club` and one confirmation
  for the lead. Honeypot submissions pretend success without persisting a lead.
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
- `enterprise.spec.ts` — services-led page, single contact form, contact
  validation runs with no private creds; the happy-path lead insert is gated on
  Convex config.
- `signup.spec.ts` — signup entry point (CTA→`/perfil`→login) creds-free; the
  full Privy login→create profile flow is gated.
- `a11y.spec.ts` — axe on landing/enterprise/perfil (**0 serious/critical**),
  colour-contrast on accent text, keyboard + focus-visible.

Credential-gated specs (`@needs-creds`) `test.skip(...)` with a visible reason
when Privy / Convex config is absent (`tests/e2e/_env.ts`) — a visible skip,
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
