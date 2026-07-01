# club-app Technical Architecture

Updated: 2026-07-01

This document describes the current implementation of the Frutero Club web app.
It is written from the live source in this repository and mirrors the
internOS-facing copy at `../../../docs/technical-architecture.md`.

## System Purpose

`club-app` is the Frutero Club public site and authenticated member app:

- public marketing site for `frutero.club`
- enterprise lead-capture surface at `/enterprise`
- bilingual editorial/news surface under `/noticias`
- authenticated profile and member dashboard under `/perfil` and `/dashboard`
- public informational $PULPA roadmap at `/pulpa`

The first launch is Convex-first. The app deliberately avoids custom API routes
and relational database infrastructure until a concrete product need appears.

## Repository Layout

```text
club-app/
  app/                          # Next.js App Router
  components/
    app/                        # app masthead, Privy/Convex wrappers
    marketing/                  # landing, enterprise, publication components
    ui/                         # design-system primitives
  convex/                       # Convex schema and functions
  content/                      # typed local landing/enterprise data
  i18n/                         # next-intl routing/navigation/request config
  lib/                          # seo, analytics, fonts, content reader, member mapping
  messages/                     # es/en message namespaces
  styles/globals.css            # runtime design tokens
  tests/e2e/                    # Playwright + axe
  docs/technical-architecture.md
```

The parent `club-app/` directory is the internOS wrapper. This nested repo is
the deployable GitHub repository: `fruteroclub/app`.

## Runtime Stack

- Next.js 16 App Router with Turbopack
- React 19.2 and TypeScript 5
- Tailwind CSS v4
- next-intl 4 for Spanish/English routing and messages
- Privy React Auth for email login and embedded wallet creation
- Convex for profiles, dashboard fields, launch stats, testimonials, and leads
- Resend for best-effort lead notification and confirmation emails
- Keystatic GitHub reader for build-time news content from `fruteroclub/content`
- Vitest, React Testing Library, Playwright, and axe for verification

No wagmi, viem, contracts, token indexer, PostgreSQL, or app API routes are in
the current launch path.

## Route Architecture

The app uses a locale segment with next-intl `localePrefix: "as-needed"`:

- `/` is Spanish and canonical.
- `/en` is English.
- `/es` and `/es/...` redirect to the prefixless Spanish URL.

Route groups:

```text
app/[locale]/
  (marketing)/
    page.tsx                 # landing
    enterprise/page.tsx      # enterprise/services + contact form
    marketplace/page.tsx     # in-development placeholder
    noticias/page.tsx        # article index
    noticias/[slug]/page.tsx # article detail
  (app)/
    layout.tsx               # Privy + Convex + auth guard
    perfil/page.tsx          # signup/profile entry
    perfil/edit/page.tsx     # profile edit
    dashboard/page.tsx       # first board / welcome bounties
    pulpa/page.tsx           # public informational roadmap
  (design)/design/page.tsx   # primitive showcase
```

Marketing pages are `force-static` where possible. Authenticated app routes are
dynamic because they depend on Privy and Convex state. `/pulpa` is intentionally
readable without auth even though it lives in the `(app)` group.

## Providers And Request Flow

The root layout only supplies app-wide metadata. The locale layout owns the real
`<html>` and `<body>`, loads global fonts, mounts next-intl, analytics, JSON-LD,
and global styles.

Marketing layout:

- mounts `ConvexClientProvider` so public Convex-backed sections can query stats
  and testimonials
- mounts `AppPrivyProvider` so masthead and hero CTAs can react to auth state
- mounts the shared SVG glyph definitions and publication frame
- loads the Petrona editorial serif only for the marketing subtree

App layout:

- mounts `ConvexClientProvider`
- mounts `AppPrivyProvider`
- renders the app masthead
- wraps protected children in `AuthGuard`

`ConvexClientProvider` only creates a Convex client when
`NEXT_PUBLIC_CONVEX_URL` is configured. Without it, children render unwrapped and
Convex hooks must surface a visible missing-config state instead of crashing.

## Authentication And Member Flow

Privy is configured for email login with embedded wallet creation on login. The
embedded wallet is identity infrastructure only; the product does not expose
public crypto/onchain language in the marketing flow.

Current member flow:

1. Public CTA links to `/perfil`.
2. Unauthenticated users see the Privy login CTA.
3. After successful login, `/perfil` redirects to `/dashboard`.
4. If the user has no Convex profile, `/dashboard` redirects back to `/perfil`
   so identity is completed first.
5. The profile form writes identity fields through `clubApp.saveProfile`.
6. The dashboard writes the welcome bounty fields through `clubApp.saveBounty`.

Profile identity fields are first-class Convex fields, not metadata blobs:

- first name and last name on `users`
- member role on `profiles`
- city, country, favorite fruit, and preferred color on `profiles`

Welcome bounty fields are also on `profiles`:

- `testimony`
- `githubUrl`
- `websiteUrl`

## Convex Data Model

The launch schema lives in `convex/schema.ts`.

Tables:

- `users`: Privy DID, email, username/displayName, first/last name, wallets,
  account role/status, login timestamps, metadata.
- `profiles`: user-linked public profile fields, location, social links,
  learning tracks, visibility, availability, stats, member role, favorite fruit,
  preferred color, testimony.
- `leads`: enterprise/landing form submissions with source, locale, status, and
  optional metadata.

Public Convex functions in `convex/clubApp.ts`:

- `getProfile`: returns the current user/profile by Privy DID.
- `saveProfile`: creates or updates account identity and profile identity.
- `saveBounty`: patches one dashboard bounty field.
- `getLaunchStats`: counts active launch builders and GitHub project links, with
  fixed launch values for events and opportunities.
- `getRandomTestimonials`: returns up to six randomized public testimonials.
- `submitLead`: validates and stores a lead, then schedules email notification.

Internal action:

- `notifyLead`: sends lead emails through Resend if configured.

## Lead Capture And Email

`components/marketing/ContactForm.tsx` is the single enterprise lead-capture
client island. It validates in the browser, uses a honeypot field for simple bot
filtering, and calls `api.clubApp.submitLead`.

`submitLead`:

1. silently treats honeypot submissions as successful without storing them
2. validates name, email, organization, and message limits
3. inserts the row into the `leads` table
4. schedules `internal.clubApp.notifyLead`

`notifyLead`:

- reads `RESEND_API_KEY`, `RESEND_FROM`, and `CONTACT_FALLBACK_EMAIL`
- defaults notifications to `hola@frutero.club` when `CONTACT_FALLBACK_EMAIL`
  is absent
- sends one internal notification with the lead details
- sends one confirmation email to the lead
- logs and returns a skipped/failed result instead of failing the form flow

The email side effect is best-effort. Convex lead persistence is the source of
truth for the captured lead.

## Content And News Pipeline

News content comes from the public `fruteroclub/content` repository. The app uses
Keystatic's GitHub reader plus the GitHub trees API at build time.

Rules:

- `GITHUB_TOKEN` is required at build to avoid GitHub rate-limit failures.
- Failure to fetch the content tree fails the build by design.
- Slug and language are path-derived.
- Frontmatter is revalidated against the `ArticleMeta` schema from
  `@fruteroclub/content`.
- Static article pages, metadata, sitemap entries, and OG routes are generated
  from that content.

This means merging content does not update the live site by itself. The app must
rebuild on Vercel after content changes.

## Design System

The parent `DESIGN.md` is the design reference. Runtime tokens live in
`styles/globals.css`, and the component primitives live in `components/ui`.

Current primitives include:

- `Button`
- `Card`
- `Badge`
- `Avatar`
- `FormCard`

`FormCard` is the launch form surface:

- shell uses warm `bg-surface`
- controls use lighter `bg-card`
- border is muted and editorial, not a generic white card
- the surface is paper-locked so forms remain readable inside dark marketing
  bands

Marketing components live in `components/marketing` and include masthead/footer,
arcade sections, proof strip, opportunity marketplace, testimonials/player cards,
latest magazine, FAQ, CTA band, and enterprise page sections.

## Environment Variables

Required for local app behavior:

```text
NEXT_PUBLIC_PRIVY_APP_ID
CONVEX_DEPLOYMENT
NEXT_PUBLIC_CONVEX_URL
NEXT_PUBLIC_CONVEX_SITE_URL
GITHUB_TOKEN
NEXT_PUBLIC_SITE_URL
```

Required for real lead emails:

```text
RESEND_API_KEY
RESEND_FROM
CONTACT_FALLBACK_EMAIL=hola@frutero.club
```

Deployment notes:

- `NEXT_PUBLIC_SITE_URL=https://frutero.club` makes production pages indexable.
- Preview/staging URLs should use their own origin and remain noindex.
- Convex functions must be deployed/synced for the same deployment URL used by
  Vercel.
- Resend variables must be configured in Convex for `notifyLead`, not only in
  Next.js runtime env.

## Local Development

```bash
bun install
bun run dev
bunx convex dev
```

Useful local checks:

```bash
bunx tsc --noEmit
bun run lint
bun run test
bun run build
bun run test:e2e
```

Playwright can run against a deployed preview by setting `E2E_BASE_URL`.
Credential-gated e2e tests skip visibly when Convex or Privy envs are missing.

## Launch Constraints

These are intentional first-launch constraints, not missing implementation by
accident:

- Convex is the only backend for launch.
- `$PULPA` is informational/roadmap-first; no live distribution or leaderboard
  accounting exists yet.
- Marketplace is an in-development placeholder.
- One GitHub project link per user is represented by `profiles.githubUrl`.
- Enterprise leads persist in Convex and trigger best-effort Resend email.
- News content requires a rebuild after content changes.
- Production launch requires correct Vercel envs, Convex envs, and the
  `frutero.club` apex pointing at the production deployment.

## Verification Surface

Automated coverage is risk-weighted:

- Vitest covers landing behavior, auth-aware CTAs, navigation menu behavior,
  profile-login redirect, locale message parity, content helpers, SEO helpers,
  analytics, and UI primitives.
- Playwright covers landing, enterprise form validation, signup entry, and axe
  accessibility checks. Convex-backed happy paths are gated on env availability.
- `next build` is the production build gate and also validates build-time news
  fetching.

## Related Files

- `AGENTS.md`
- `.env.example`
- `convex/schema.ts`
- `convex/clubApp.ts`
- `components/marketing/ContactForm.tsx`
- `components/ui/form-card.tsx`
- `lib/content/articles.ts`
- `docs/production-migration-plan.md`
