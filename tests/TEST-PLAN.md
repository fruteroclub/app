# Test plan — club-app (artifact for `/qa`)

Risk-weighted test matrix for the landing + perfil build (plan T8). Full coverage
on logic/flows, lighter on pure visuals. This is the map `/qa` should walk when
exercising the app manually; the automated layer below is what `bun run test` /
`bun run test:e2e` already enforce.

## How to run

```bash
bun run test                          # Vitest unit + integration (116 tests, no creds)
bunx playwright install chromium      # once, before the first e2e run
bun run test:e2e                      # Playwright e2e + axe (builds + serves the app)
# or against a deployed preview:
E2E_BASE_URL=https://<preview> bun run test:e2e
```

`bun run test` needs **no credentials** — DB/Privy/Resend are mocked at the seam.
E2E flows that mutate real state are gated and skip visibly when creds are absent
(`tests/e2e/_env.ts`).

## Matrix

### 1. Auth / profile — HIGH

| Scenario | Expected | Automated |
|---|---|---|
| POST /api/profile, no existing profile | 201, profile created | `route.test.ts` |
| POST /api/profile, profile exists | 200, idempotent update | `route.test.ts` |
| POST /api/profile, handle already taken (race) | 409, inline "ese handle ya existe" | `route.test.ts` (PG 23505) |
| POST /api/profile, invalid/expired token | 401, "vuelve a iniciar sesión" | `route.test.ts`, `auth.test.ts` |
| POST /api/profile, invalid body | 400, field errors | `route.test.ts` |
| POST /api/profile, Privy misconfigured | 500 | `route.test.ts` |
| POST /api/profile, DB down | 502 | `route.test.ts` |
| GET /api/profile | 200 / 404 / 401 | `route.test.ts` |
| Full signup (login → create → see perfil) | perfil view renders | `e2e/signup.spec.ts` (@needs-creds) |
| Navigate away mid-create | idempotent upsert by privy_did, resumes | route-level upsert |

### 2. Contact / leads — HIGH

| Scenario | Expected | Automated |
|---|---|---|
| Valid submit | 201, lead inserted + Resend email | `route.test.ts` |
| Email fails after insert | 200 (lead saved, system of record) + alert log | `route.test.ts` |
| Invalid fields | 400, inline field errors | `route.test.ts`, `e2e/enterprise.spec.ts` |
| Honeypot filled | 200 pretend-success, NO insert | `route.test.ts` |
| Rate-limited (per-IP window) | 429 banner | `route.test.ts` |
| DB down | 502 + fallback email address shown | `route.test.ts` |
| Double-submit | button disabled, single POST | ContactForm guard |
| Lead row persists | row in `leads` (DB = system of record) | `e2e/enterprise.spec.ts` (@needs-creds) |

### 3. i18n / routing — HIGH

| Scenario | Expected | Automated |
|---|---|---|
| ES apex `/` | Spanish, no prefix | `e2e/landing.spec.ts` |
| `/en` | English | `e2e/landing.spec.ts` |
| `/es` and `/es/...` | 308 → bare canonical | `middleware.test.ts`, `e2e/landing.spec.ts` |
| Query string on `/es/x?q=1` | preserved through redirect | `middleware.test.ts` |
| `/esp` (non-locale) | NOT treated as `/es` | `middleware.test.ts` |
| Missing translation key | CI failure (parity guard) | `i18n/messages.test.ts` |
| Empty-string translation | CI failure | `i18n/messages.test.ts` |

### 4. Design system — LIGHTER (behavior, not exhaustive snapshots)

| Scenario | Expected | Automated |
|---|---|---|
| Button press / disabled | states render | `ui/__tests__/button.test.tsx` |
| Badge variants | render | `ui/__tests__/badge.test.tsx` |
| ProgressBar value clamp | clamps to 0..100 | `ui/__tests__/progress-bar.test.tsx` |
| Glyph by name | sprite renders | `__tests__/glyph.test.tsx` |
| Paper-only public (no MODO) | toggle absent on marketing | landing RTL + e2e |

### 5. Landing — RTL + E2E

| Scenario | Expected | Automated |
|---|---|---|
| 8 sections render ES + EN | all present | `landing.test.tsx` |
| Primary + closing CTA | → `/perfil` | `landing.test.tsx`, `e2e/landing.spec.ts` |
| Proof numbers | flagged placeholders, not invented | `landing.test.tsx` (`data-proof-pending`) |
| Vocabulary (no onchain/web3/crypto/blockchain) | absent; "verificable" present | `landing.test.tsx`, `e2e/landing.spec.ts` |
| Featured set | no fake "EN VIVO / LIVE" claim | `landing.test.tsx` |

### 6. Accessibility (axe) — landing / enterprise / perfil

| Scenario | Expected | Automated |
|---|---|---|
| axe on landing (ES + EN) | 0 serious/critical | `e2e/a11y.spec.ts` |
| axe on /enterprise | 0 serious/critical | `e2e/a11y.spec.ts` |
| axe on /perfil | 0 serious/critical | `e2e/a11y.spec.ts` |
| Colour-contrast on accent text | passes | `e2e/a11y.spec.ts` |
| Keyboard reach + focus-visible | form reachable, focus lands on a control | `e2e/a11y.spec.ts` |

## Manual `/qa` checklist (beyond automation)

- LCP < 1.5s on the landing (plan perf gate) — measure on a built `bun run start`.
- Lighthouse ≥ 95 on landing + /enterprise (T7 gate).
- Locale switch from `/` ↔ `/en` keeps the user on the same logical page.
- Real Resend delivery on a throwaway address before go-live (domain verified).
- Operator inputs present before go-live: proof numbers + nameable clients (the
  `data-proof-pending` placeholders must be resolved — a credibility surface must
  not ship invented figures), and the two unlock thresholds pinned.

## Known gaps / blockers (not silent — reported)

- E2E happy-paths for signup + real lead insert require Privy + `DATABASE_URL`;
  they skip with a visible reason until provisioned.
- Playwright browser binary (`chromium`) must be installed once before e2e runs.
- Rate-limit is in-memory (best-effort on serverless); honeypot is the real spam
  defense. Escalate to Upstash if abused.
