# Test plan — club-app (artifact for `/qa`)

Risk-weighted test matrix for the landing + perfil build (plan T8). Full coverage
on logic/flows, lighter on pure visuals. This is the map `/qa` should walk when
exercising the app manually; the automated layer below is what `bun run test` /
`bun run test:e2e` already enforce.

## How to run

```bash
bun run test                          # Vitest unit + integration (no creds)
bunx playwright install chromium      # once, before the first e2e run
bun run test:e2e                      # Playwright e2e + axe (builds + serves the app)
# or against a deployed preview:
E2E_BASE_URL=https://<preview> bun run test:e2e
```

`bun run test` needs **no credentials**. E2E flows that mutate real state are
gated and skip visibly when Privy or Convex config is absent
(`tests/e2e/_env.ts`).

## Matrix

### 1. Auth / profile — HIGH

| Scenario                                  | Expected                                   | Automated                           |
| ----------------------------------------- | ------------------------------------------ | ----------------------------------- |
| First profile save                        | Convex user + profile created              | `saveProfile` mutation              |
| Existing profile save                     | User/profile patched idempotently          | `saveProfile` mutation              |
| Profile view                              | Reads reactive Convex profile by Privy DID | `perfil` client + e2e               |
| Dashboard bounty save                     | Only the selected profile field changes    | `saveBounty` mutation               |
| Full signup (login → create → see perfil) | perfil view renders                        | `e2e/signup.spec.ts` (@needs-creds) |
| Navigate away mid-create                  | Convex upsert by Privy DID resumes         | profile flow                        |

### 2. Contact / leads — HIGH

| Scenario          | Expected                                                      | Automated                               |
| ----------------- | ------------------------------------------------------------- | --------------------------------------- |
| Valid submit      | Convex lead inserted, notification scheduled, thank-you shown | `e2e/enterprise.spec.ts` (@needs-creds) |
| Invalid fields    | Inline field errors, no mutation                              | `e2e/enterprise.spec.ts`                |
| Honeypot filled   | Pretend-success, no insert                                    | `submitLead` mutation                   |
| Double-submit     | button disabled, single mutation                              | ContactForm guard                       |
| Lead row persists | row in Convex `leads` table                                   | `e2e/enterprise.spec.ts` (@needs-creds) |

### 3. i18n / routing — HIGH

| Scenario                    | Expected                   | Automated                                   |
| --------------------------- | -------------------------- | ------------------------------------------- |
| ES apex `/`                 | Spanish, no prefix         | `e2e/landing.spec.ts`                       |
| `/en`                       | English                    | `e2e/landing.spec.ts`                       |
| `/es` and `/es/...`         | 308 → bare canonical       | `middleware.test.ts`, `e2e/landing.spec.ts` |
| Query string on `/es/x?q=1` | preserved through redirect | `middleware.test.ts`                        |
| `/esp` (non-locale)         | NOT treated as `/es`       | `middleware.test.ts`                        |
| Missing translation key     | CI failure (parity guard)  | `i18n/messages.test.ts`                     |
| Empty-string translation    | CI failure                 | `i18n/messages.test.ts`                     |

### 4. Design system — LIGHTER (behavior, not exhaustive snapshots)

| Scenario                    | Expected                   | Automated                            |
| --------------------------- | -------------------------- | ------------------------------------ |
| Button press / disabled     | states render              | `ui/__tests__/button.test.tsx`       |
| Badge variants              | render                     | `ui/__tests__/badge.test.tsx`        |
| ProgressBar value clamp     | clamps to 0..100           | `ui/__tests__/progress-bar.test.tsx` |
| Glyph by name               | sprite renders             | `__tests__/glyph.test.tsx`           |
| Paper-only public (no MODO) | toggle absent on marketing | landing RTL + e2e                    |

### 5. Landing — RTL + E2E

| Scenario                                       | Expected                           | Automated                                 |
| ---------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| 8 sections render ES + EN                      | all present                        | `landing.test.tsx`                        |
| Primary + closing CTA                          | → `/perfil`                        | `landing.test.tsx`, `e2e/landing.spec.ts` |
| Proof numbers                                  | flagged placeholders, not invented | `landing.test.tsx` (`data-proof-pending`) |
| Vocabulary (no onchain/web3/crypto/blockchain) | absent; "verificable" present      | `landing.test.tsx`, `e2e/landing.spec.ts` |
| Featured set                                   | no fake "EN VIVO / LIVE" claim     | `landing.test.tsx`                        |

### 6. Accessibility (axe) — landing / enterprise / perfil

| Scenario                       | Expected                                 | Automated          |
| ------------------------------ | ---------------------------------------- | ------------------ |
| axe on landing (ES + EN)       | 0 serious/critical                       | `e2e/a11y.spec.ts` |
| axe on /enterprise             | 0 serious/critical                       | `e2e/a11y.spec.ts` |
| axe on /perfil                 | 0 serious/critical                       | `e2e/a11y.spec.ts` |
| Colour-contrast on accent text | passes                                   | `e2e/a11y.spec.ts` |
| Keyboard reach + focus-visible | form reachable, focus lands on a control | `e2e/a11y.spec.ts` |

## Manual `/qa` checklist (beyond automation)

- LCP < 1.5s on the landing (plan perf gate) — measure on a built `bun run start`.
- Lighthouse ≥ 95 on landing + /enterprise (T7 gate).
- Locale switch from `/` ↔ `/en` keeps the user on the same logical page.
- Operator inputs present before go-live: proof numbers + nameable clients (the
  `data-proof-pending` placeholders must be resolved — a credibility surface must
  not ship invented figures), and the two unlock thresholds pinned.

## Known gaps / blockers (not silent — reported)

- E2E happy-paths for signup + real lead insert require Privy + Convex config;
  they skip with a visible reason until provisioned.
- Playwright browser binary (`chromium`) must be installed once before e2e runs.
- Honeypot is the initial spam defense. Add a stronger service only if abuse
  appears.
