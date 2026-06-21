import type { GlyphName } from '@/components/Glyph'
import type { AccentColor } from './landing'

/**
 * Structured, typed data for the /enterprise page (T6).
 *
 * Split of concerns (mirrors content/landing.ts): STRUCTURE (glyphs, accent
 * colors, ordering, the contact anchor) lives here; COPY lives in next-intl
 * `messages/{es,en}/enterprise.json` keyed by the `i18nKey`s below.
 *
 * GTM (plan: "/enterprise leads with proven Pokta services; recruiting is
 * 'talk to us', gated"): the page leads with PROVEN SERVICES, then a softer
 * "verified talent / recruiting" block that routes to the same single
 * ContactForm — recruiting is gated behind a conversation, not a self-serve flow.
 *
 * VOCABULARY (Hard rule #3): public term is "perfil"; lead with "verifiable".
 * Never "onchain / web3 / crypto" in the copy — the message files say
 * "talento verificable" / "verifiable talent", not "onchain reputation".
 */

/** The in-page anchor the hero CTA + nav scroll to. */
export const CONTACT_ANCHOR = 'contacto'

/** A proven service offering card. */
export interface EnterpriseService {
  i18nKey: string
  glyph: GlyphName
  accent: AccentColor
}

/**
 * Proven Pokta services (the lead). Copy lives in the `enterprise.services.*`
 * message keys. These are the services Frutero/Pokta already delivers — the
 * credible front door for an enterprise lead.
 */
export const ENTERPRISE_SERVICES: readonly EnterpriseService[] = [
  { i18nKey: 'build', glyph: 'bolt', accent: 'magenta' },
  { i18nKey: 'hackathons', glyph: 'hex', accent: 'green' },
  { i18nKey: 'talent', glyph: 'star', accent: 'orange' },
] as const
