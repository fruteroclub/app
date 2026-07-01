# Frutero Club Production Migration Plan

Updated: 2026-07-01  
Status: Draft. Convex production is configured; domain cutover has not been
executed from this plan.

## Goal

Move the new `fruteroclub/app` project to the public production domain
`https://frutero.club`, keep `https://dev.frutero.club` for non-production
validation, and make an explicit Convex database decision before launch.

The migration has two separate decision tracks:

1. Infra/domain routing: `app` becomes the production project for
   `frutero.club` and `www.frutero.club`; `dev.frutero.club` remains the
   development/staging surface.
2. Data/backend: choose whether the new app uses its current Convex deployment,
   a fresh production Convex deployment, or the legacy Convex deployment
   currently associated with `frutero-app`.

## Verified Current State

### Vercel

- Team: `fruteroclub`
- New project: `app`
  - Project ID: `prj_XF45oX5ER54841FPyx5OJ1REuuK5`
  - Current latest production URL: `https://dev.frutero.club`
  - Node: `24.x`
  - Linked local repo: `code/club-app/.vercel/project.json`
- Current production project: `frutero-app`
  - Project ID: `prj_jd1aFfX34tofgmReiLA5I4AdloeA`
  - Current latest production URL: `https://www.frutero.club`
  - Node: `22.x`
- Domain ownership:
  - `frutero.club` is already under the `fruteroclub` Vercel team.
  - Current project mappings:
    - `app`: `dev.frutero.club`
    - `frutero-app`: `frutero.club`, `www.frutero.club`
  - Registrar is third-party. Current nameservers are not Vercel nameservers,
    but the domain is already on Vercel Edge. Do not change registrar or
    nameservers during this migration unless domain verification fails.

### New App Environment

The `app` Vercel project already has encrypted Production and Preview
environment variables for:

- Convex: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`,
  `NEXT_PUBLIC_CONVEX_SITE_URL`
- Content build: `GITHUB_TOKEN`
- Site URL: `NEXT_PUBLIC_SITE_URL`
- Auth: `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET`,
  `NEXT_PUBLIC_PRIVY_CLIENT_ID`
- Email: `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_FALLBACK_EMAIL`

One leftover Production variable is present:

- `DATABASE_URL`

The new app is Convex-first and should not need `DATABASE_URL`. Remove this from
Vercel after the final code audit confirms no runtime usage.

Confirmed Vercel state on 2026-07-01 after Convex and Privy production setup:

- Production:
  - `NEXT_PUBLIC_SITE_URL=https://frutero.club`
  - Convex points at `prod:aware-flamingo-310`
    (`https://aware-flamingo-310.convex.cloud`)
  - `NEXT_PUBLIC_PRIVY_APP_ID` matches `frutero-app` production's Privy app ID.
  - `NEXT_PUBLIC_PRIVY_CLIENT_ID` and `PRIVY_APP_SECRET` are present only in
    Production, but the new app does not read either variable today.
  - `GITHUB_TOKEN` is present only in Production.
  - `DATABASE_URL` is present only in Production and should be removed before
    launch unless a final audit finds a real use.
- Preview:
  - `NEXT_PUBLIC_SITE_URL=https://dev.frutero.club`
  - Convex points at `dev:dutiful-chicken-115`
    (`https://dutiful-chicken-115.convex.cloud`)
  - `NEXT_PUBLIC_PRIVY_APP_ID` matches the current `app` Production value.
  - `NEXT_PUBLIC_PRIVY_CLIENT_ID` and `PRIVY_APP_SECRET` are absent.
  - `GITHUB_TOKEN` is present only in Preview.
- Development:
  - No variables are configured.
- Shared Production + Preview:
  - `RESEND_API_KEY`
  - `RESEND_FROM`
  - `CONTACT_FALLBACK_EMAIL`

Required correction before production cutover:

- Keep Preview on a separate staging/dev Privy app unless the team explicitly
  wants `dev.frutero.club` to authenticate real production users.

Completed Privy production setup:

- `app` Production `NEXT_PUBLIC_PRIVY_APP_ID` now matches the existing
  `frutero-app` Production Privy app ID, so users keep the same Privy DIDs.
- The value is stored as non-sensitive Vercel config because `NEXT_PUBLIC_*`
  values are public in the built client.
- A new Vercel Production deployment is required before the live production build
  uses the updated value.

Completed Convex production setup:

- Production deployment:
  - team/project/reference: `mel-troopdegen:frutero-club-app:production`
  - deployment: `aware-flamingo-310`
  - cloud URL: `https://aware-flamingo-310.convex.cloud`
  - site URL: `https://aware-flamingo-310.convex.site`
- Deployed launch schema/functions to production.
- Added Convex production env vars:
  - `RESEND_API_KEY`
  - `RESEND_FROM`
  - `CONTACT_FALLBACK_EMAIL`
- Verified production function call:
  - `clubApp:getLaunchStats` returns launch defaults with empty production data:
    `activeBuilders=0`, `projects=0`, `events=100`, `opportunities=5`.

### Convex

The new app schema is intentionally small:

- `users`
- `profiles`
- `leads`

The legacy `frutero-current-app` schema is much broader and includes users,
profiles, events, programs, projects, applications, bounties, bootcamp, studio,
and related tables.

Legacy Convex inventory is not yet reliable from one source:

- `code/frutero-current-app/docs/CONVEX.md` references
  `dev:efficient-manatee-738`.
- `code/frutero-current-app/src/providers/convex-provider.tsx` falls back to
  `https://brainy-porcupine-595.convex.cloud` when
  `NEXT_PUBLIC_CONVEX_URL` is absent.

Before reusing the old Convex database, inspect the actual Vercel env values in
the `frutero-app` dashboard and export the deployment data. Do not assume the
docs or source fallback identify production correctly.

## Recommended Database Decision

Use a fresh or current production Convex deployment dedicated to
`fruteroclub/app`, and keep the legacy `frutero-app` Convex deployment as an
archive/rollback source.

Reasoning:

- The new app's launch schema is deliberately minimal and matches the current
  product surface: accounts, profiles, testimonials/projects via profile data,
  launch stats, and enterprise leads.
- The legacy schema belongs to a larger Poktapok-era product surface with many
  tables the launch app does not use.
- Reusing the old database directly increases the risk of schema drift,
  function collisions, unexpected auth/profile states, and legacy data shaping
  the first production launch.

The only reason to reuse or migrate from the old database is if preserving
existing `frutero.club` users/profiles is a hard launch requirement. If that is
required, do a selective export/transform/import into the new schema rather than
pointing the new app at the old database wholesale.

## Privy And Existing Users

Decision: use the existing production Privy app from `fruteroclub/frutero-app`.

This keeps existing Privy users and their `did:privy:*` identifiers. The new app
uses only `NEXT_PUBLIC_PRIVY_APP_ID` in `components/app/AppPrivyProvider.tsx`;
it does not currently read `NEXT_PUBLIC_PRIVY_CLIENT_ID` or `PRIVY_APP_SECRET`.

Implication: any profile/testimonial data created in the new `app` while it was
using a different Privy app ID will not automatically attach to the legacy
production users after the switch. If we need to preserve those rows, migrate or
re-associate them by email before cutover.

Minimum data needed for launch:

- user identity by `privyDid`
- `profiles.testimony`
- `profiles.githubUrl`
- `profiles.websiteUrl`

Legacy `frutero-current-app` has user/profile/project data, but it does not
appear to have a first-class user testimonial field. It can potentially supply:

- identity: `users.privyDid`, `users.email`, `users.displayName`,
  `users.username`, wallet fields
- GitHub: `profiles.githubUrl` and/or one selected `projects.githubUrl`
- Website/project URL: one selected `projects.demoUrl`

The launch app should keep the three live bounty fields on the new `profiles`
table. Import only those fields for now; defer the full legacy user/profile
migration.

## Open Decisions

1. Canonical domain:
   - Recommended: `https://frutero.club`
   - `https://www.frutero.club` should redirect or alias to the apex.
2. `dev.frutero.club` semantics:
   - Recommended: make it a Preview/development branch domain for the new app.
   - If Vercel project constraints make that awkward, keep it as a staging
     alias but ensure it uses staging env values and remains noindex.
3. Privy:
   - Production is configured to use the existing `frutero-app` production Privy
     app.
   - Preview/dev should use a separate staging Privy app unless testing against
     production users is intentional.
4. Data preservation:
   - Required for first launch: preserve or import only the live bounty fields
     needed now: testimonial, project GitHub URL, and website URL.
   - Full legacy user/profile migration is deferred.

## Phase 0: Freeze, Inventory, Backup

Before cutover:

1. Freeze production-domain changes on both Vercel projects.
2. Capture the current `frutero-app` production deployment URL for rollback.
3. Capture the latest known-good `app` deployment URL.
4. Export or snapshot the legacy Convex deployment that actually backs
   `frutero-app`.
5. Export or snapshot the new app Convex deployment.
6. Save an env-name inventory for both Vercel projects. Do not commit pulled
   env files.
7. Confirm `app` has no custom API routes or PostgreSQL runtime dependency.
8. Remove the `DATABASE_URL` variable from `app` only after step 7 passes.

Useful inspection commands:

```bash
vercel project ls --scope fruteroclub
vercel project inspect app --scope fruteroclub
vercel project inspect frutero-app --scope fruteroclub
vercel domains inspect frutero.club --scope fruteroclub
vercel env ls production --cwd code/club-app --scope fruteroclub
vercel env ls preview --cwd code/club-app --scope fruteroclub
```

## Phase 1: Prepare `app` Production

1. Land the launch branch into `main`.
2. Confirm the `app` production environment has:
   - `NEXT_PUBLIC_SITE_URL=https://frutero.club`
   - production Convex deployment values
   - production Privy app values
   - `GITHUB_TOKEN`
   - Resend values where needed
3. Confirm the Preview/development environment has:
   - `NEXT_PUBLIC_SITE_URL=https://dev.frutero.club`
   - development/staging Convex deployment values
   - development/staging Privy values
   - `GITHUB_TOKEN`
4. Deploy `app` from `main`.
5. Smoke-test the deployment URL before attaching production domains:
   - `/`
   - `/enterprise`
   - `/marketplace`
   - `/pulpa`
   - `/dashboard`
   - `/perfil`
   - profile edit flow
   - enterprise lead form
   - news/content pages
6. Confirm production is indexable only when the host is `frutero.club`; keep
   `dev.frutero.club` noindex.

## Phase 2: Prepare Convex

Status: base production setup is complete. Remaining Convex work is data import
planning and auth/profile smoke testing with the final production Privy app.

1. Choose the production Convex deployment for `app`.
2. Deploy Convex functions/schema to that deployment.
3. Set Convex-side env values used by server actions/internal actions:
   - `RESEND_API_KEY`
   - `RESEND_FROM`
   - `CONTACT_FALLBACK_EMAIL=hola@frutero.club`
4. Verify these functions against the chosen deployment:
   - `clubApp:getLaunchStats`
   - `clubApp:getRandomTestimonials`
   - `clubApp:submitLead`
   - profile read/write functions
5. If migrating selected legacy data, run it as a one-time transform into the
   new schema:
   - `users.privyDid`, `email`, `displayName`, wallet fields
   - `profiles.city`, `country`, social links, website/project/testimonial
     fields where available
   - no bounties, bootcamp, events, or studio data unless explicitly required
6. Test auth with at least one existing account and one new account.

## Phase 3: Domain Cutover

Use the Vercel dashboard for the actual attach/detach steps unless we decide to
script them separately.

1. Remove `frutero.club` and `www.frutero.club` from `frutero-app`.
2. Add `frutero.club` and `www.frutero.club` to `app`.
3. Keep `dev.frutero.club` on `app`, but assign it to the Preview/development
   environment or branch if Vercel supports that for the project setup.
4. Verify:
   - `https://frutero.club`
   - `https://www.frutero.club`
   - `https://dev.frutero.club`
5. Confirm canonical behavior:
   - preferred canonical host is `frutero.club`
   - `www.frutero.club` redirects or canonicalizes to `frutero.club`
6. Do not change registrar nameservers during cutover unless Vercel explicitly
   requires it for verification.

## Phase 4: Post-Cutover QA

Run this immediately after the domain switch:

1. Marketing routes:
   - home hero CTA/auth CTA states
   - opportunities anchor
   - enterprise page and contact form
   - marketplace placeholder
   - `$PULPA` page
2. Auth routes:
   - login redirects to dashboard
   - navbar menu appears when authenticated
   - logout works
   - profile view/edit works
3. Convex:
   - launch stats load
   - six testimonials load without legacy slug artifacts
   - profile changes persist
   - lead is stored in `leads`
4. Email:
   - lead confirmation email sends to submitter
   - internal notification sends to `hola@frutero.club`
5. Content:
   - GitHub content tree fetch works at build
   - latest article cards render
6. SEO:
   - `frutero.club` is indexable
   - `dev.frutero.club` is noindex
   - canonical URLs point at production
7. Logs:
   - Vercel runtime/build logs have no Convex provider errors
   - Convex logs have no missing public function errors
   - Resend delivery logs show accepted sends

## Rollback Plan

If cutover fails:

1. Remove `frutero.club` and `www.frutero.club` from `app`.
2. Re-add `frutero.club` and `www.frutero.club` to `frutero-app`.
3. Keep the old Convex deployment untouched during the rollback window.
4. Restore any env values changed on `frutero-app` only if they were modified.
5. Re-test `https://frutero.club`, `https://www.frutero.club`, and login on the
   old app.

Rollback should not require registrar DNS changes if the migration stays within
the same Vercel team/domain.

## Go / No-Go Checklist

Go only when all are true:

- `app` production build passes on Vercel.
- `app` production env values are set for the final domain.
- `app` Preview/development env values are set for `dev.frutero.club`.
- Convex production deployment is chosen and functions are deployed.
- Resend lead confirmation and internal notification are verified.
- `GITHUB_TOKEN` is set for production builds.
- `DATABASE_URL` is removed from `app` or explicitly confirmed unused and
  scheduled for removal.
- Existing `frutero-app` deployment URL and Convex export are captured for
  rollback.
- The team has decided whether legacy users/profiles are migrated or intentionally
  left behind for first launch.
