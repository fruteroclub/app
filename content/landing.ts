import type { GlyphName } from "@/components/Glyph";

/**
 * Structured, typed data for the public landing (T5).
 *
 * Split of concerns: STRUCTURE (glyphs, accent colors, tier levels, ordering,
 * CTA targets) lives here in typed config; COPY lives in next-intl
 * `messages/{es,en}/landing.json` keyed by the `i18nKey`s below. This keeps the
 * design-driven structure type-checked while translators only ever touch JSON.
 *
 * VOCABULARY (Hard rule #3): public term is "perfil"; we lead with "verifiable"
 * and never say "onchain / web3 / crypto" in the copy. The preview HTML's
 * "reputación onchain" is intentionally rewritten to "reputación verificable" in
 * the message files.
 *
 * PROOF NUMBERS (plan "Open blockers"): the hero proof-strip values are operator
 * inputs and are NOT yet supplied. They are exported as `null` placeholders and
 * the component renders a visible "—" with a flag rather than shipping invented
 * credibility numbers silently (Hard rule #6: no silent failures / no fake proof).
 */

export type AccentColor = "magenta" | "green" | "orange" | "muted";

/** Primary signup destination — the locale-aware `/perfil` route (T4). */
export const SIGNUP_HREF = "/perfil";
/** Services / leads page (T6). */
export const ENTERPRISE_HREF = "/enterprise";

/** Masthead nav. `href` is an in-page anchor or a route. */
export interface NavItem {
  i18nKey: string;
  href: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { i18nKey: "nav.how", href: "#como-funciona" },
  { i18nKey: "nav.unlocks", href: "#desbloquea" },
  { i18nKey: "nav.enterprise", href: ENTERPRISE_HREF },
] as const;

/**
 * Hero proof strip ("heronums" in the preview). Values are OPERATOR INPUTS.
 *
 * The `value: string | null` shape is RETAINED (a `null` still renders the flagged
 * "Pronto"/"Soon" placeholder), but per the plan's "real proof, not placeholders"
 * frame these now carry PLACEHOLDER numbers so the structure is visible end-to-end.
 *
 * TODO-swap: replace these four values with the operator's real, current numbers
 * before the real-proof go-live (plan "Operator data contract" item 1). The fourth
 * stat dropped "gas/sin barreras" in favor of "oportunidades desbloqueadas".
 */
export interface ProofStat {
  /** Operator-supplied display value. `null` => render a flagged placeholder. */
  value: string | null;
  i18nKey: string;
}

export const PROOF_STATS: readonly ProofStat[] = [
  { value: "+850", i18nKey: "proof.builders" }, // TODO-swap: real builders activos
  { value: "1,200+", i18nKey: "proof.projects" }, // TODO-swap: real proyectos enviados
  { value: "45", i18nKey: "proof.events" }, // TODO-swap: real eventos
  { value: "120+", i18nKey: "proof.unlocks" }, // TODO-swap: real oportunidades desbloqueadas
] as const;

/**
 * High-score card rows ("TOP CONSTRUCTORES · EN VIVO"). Until the directory +
 * scoring exist (deferred to the product plan), the landing shows a static
 * featured set (plan: "landing uses a static featured set"). Names/roles/scores
 * here are illustrative featured builders, not live data — the card header copy
 * does NOT claim "EN VIVO" in this v0 (avoids implying a live feed we don't have).
 */
/** The three pillars of the loop (Construye · Demuestra · Desbloquea). */
export interface Pillar {
  index: string;
  i18nKey: string;
  glyph: GlyphName;
  accent: AccentColor;
}

export const PILLARS: readonly Pillar[] = [
  { index: "01", i18nKey: "pillars.build", glyph: "bolt", accent: "muted" },
  { index: "02", i18nKey: "pillars.prove", glyph: "hex", accent: "magenta" },
  { index: "03", i18nKey: "pillars.unlock", glyph: "star", accent: "green" },
] as const;

/** Reward cards ("Lo que puedes desbloquear"). Tier level is structural. */
export interface Unlock {
  i18nKey: string;
  /** Min level chip, e.g. "05" → "Nivel 05+". */
  level: string;
}

export const UNLOCKS: readonly Unlock[] = [
  { i18nKey: "unlocks.demo", level: "05" },
  { i18nKey: "unlocks.stay", level: "08" },
] as const;

/* ===========================================================================
 * #5 Opportunity Marketplace ("Lo que puedes desbloquear" reframed).
 * A community board of "power-up" opportunities. Each pays one of three
 * CURRENCIES (reputación / dinero / experiencia, color-coded) and carries a
 * RARITY tier (Pokémon-TCG inspired; the membership role). Placeholder data —
 * TODO-swap with the real marketplace before go-live.
 * =========================================================================== */

/** Membership rarity tier (Pokémon-TCG inspired). Symbol conveys the tier. */
export type Rarity = "common" | "uncommon" | "rare";

export interface RarityMeta {
  /** "dot" → a CSS circle; otherwise a Glyph name (diamond, star, …). */
  symbol: "dot" | GlyphName;
  /** i18n base for `<key>.name` (Común/Uncommon/Rare) + `.role` (the membership role). */
  i18nKey: string;
}

/** common = Community Member · uncommon = Club Member · rare = Club Contributor. */
export const RARITY: Record<Rarity, RarityMeta> = {
  common: { symbol: "dot", i18nKey: "rarity.common" },
  uncommon: { symbol: "diamond", i18nKey: "rarity.uncommon" },
  rare: { symbol: "star", i18nKey: "rarity.rare" },
} as const;

/** What an opportunity pays. Drives the colored currency chip. */
export type OppCurrency = "reputacion" | "dinero" | "experiencia";

export const CURRENCY_ACCENT: Record<OppCurrency, AccentColor> = {
  reputacion: "magenta",
  dinero: "green",
  experiencia: "orange",
} as const;

export interface Opportunity {
  id: string;
  currency: OppCurrency;
  rarity: Rarity;
  /** i18n base: `<key>.title`, `.body`, `.reward`, `.poster`. */
  i18nKey: string;
}

export const OPPORTUNITIES: readonly Opportunity[] = [
  { id: "audit", currency: "reputacion", rarity: "rare", i18nKey: "marketplace.items.audit" },
  { id: "guide", currency: "reputacion", rarity: "common", i18nKey: "marketplace.items.guide" },
  { id: "bounty", currency: "dinero", rarity: "rare", i18nKey: "marketplace.items.bounty" },
  { id: "issue", currency: "dinero", rarity: "uncommon", i18nKey: "marketplace.items.issue" },
  { id: "demo", currency: "experiencia", rarity: "uncommon", i18nKey: "marketplace.items.demo" },
  { id: "stay", currency: "experiencia", rarity: "rare", i18nKey: "marketplace.items.stay" },
] as const;

/* ===========================================================================
 * #6 Player Cards — the trading-card mechanic made visible (DESIGN.md: "every
 * member is a player card, tiered by reputation"). Replaces generic testimonials.
 * Each member is a collectible card with a RARITY tier; the `art` is a duotone
 * placeholder (TODO-swap the member-LLM-generated art). Placeholder roster.
 * =========================================================================== */
export interface Player {
  id: string;
  /** Shown verbatim (not localized). */
  name: string;
  /**
   * Three-character arcade tag (the high-score initials). The Leaderboard READS by
   * this + the weekly $PULPA; the full name shows on select. TODO-swap real handles.
   */
  acronym: string;
  /** → messages: `players.items.<id>.role`. */
  roleKey: string;
  rarity: Rarity;
  /**
   * $PULPA — the community token (score / currency / connections). On the Leaderboard
   * this is the CURRENT WEEKLY score (a weekly ranking). SNAPSHOT until the onchain
   * indexer (Envio) is live; then read from chain. (Was `rep`.)
   */
  pulpa: number;
  /** What they're building — project names, shown verbatim as CONSTRUYE chips. */
  ships: readonly string[];
  /** Card frame + duotone-art color (visual variety, not a currency). */
  accent: AccentColor;
}

export const PLAYERS: readonly Player[] = [
  // TODO-swap: real members + consent + real card art + real weekly $PULPA (indexer) + real tags.
  { id: "andres", name: "Andrés Frutero", acronym: "AFR", roleKey: "players.items.andres.role", rarity: "rare", pulpa: 2540, ships: ["Frutero OS", "zkPase"], accent: "magenta" },
  { id: "mariana", name: "Mariana Ríos", acronym: "MRI", roleKey: "players.items.mariana.role", rarity: "rare", pulpa: 2310, ships: ["Monad Audit", "MUX"], accent: "green" },
  { id: "diego", name: "Diego Romero", acronym: "DGO", roleKey: "players.items.diego.role", rarity: "uncommon", pulpa: 1980, ships: ["Demo Night", "Frutero UI"], accent: "orange" },
  { id: "valeria", name: "Valeria Méndez", acronym: "VAL", roleKey: "players.items.valeria.role", rarity: "uncommon", pulpa: 1450, ships: ["Velora App"], accent: "magenta" },
  { id: "tomas", name: "Tomás Aguilar", acronym: "TMS", roleKey: "players.items.tomas.role", rarity: "common", pulpa: 980, ships: ["Nubia ML"], accent: "green" },
  { id: "sofia", name: "Sofía Luna", acronym: "SOF", roleKey: "players.items.sofia.role", rarity: "common", pulpa: 720, ships: ["Club DevRel"], accent: "muted" },
] as const;

/**
 * All-time $PULPA record (mock/illustrative) — the historic high shown on the cabinet
 * insert-coin bar, formatted like a leaderboard entry (rarity + acronym + score).
 * TODO-swap: the real all-time record from the indexer.
 */
export const HISTORIC_RECORD: { acronym: string; rarity: Rarity; pulpa: number } = {
  acronym: "AFR",
  rarity: "rare",
  pulpa: 12480,
};

/* ===========================================================================
 * NEW landing sections (conversion rework — landing-sections-implementation-plan).
 * The arrays below are PLACEHOLDER structure so #6 Testimonios, #7 Lo último, and
 * #9 FAQ are visible end-to-end. Copy lives in messages/{es,en}/landing.json via
 * the i18n keys. Swap the placeholder structure for real operator data before the
 * real-proof go-live (plan "Operator data contract").
 * =========================================================================== */

/**
 * Testimonios (#6) — members' voices. STRUCTURE here (name, level, tone); the
 * quote + role COPY live in messages under `testimonios.items.*`.
 *
 * TODO-swap: replace with 3–5 REAL members — real name/handle + rol + nivel +
 * consent (plan "Operator data contract" item 2). `name` is shown verbatim;
 * `roleKey`/`quoteKey` resolve to localized copy.
 */
export interface Testimonial {
  /** Stable key — also the i18n sub-namespace under `testimonios.items`. */
  id: string;
  /** Shown verbatim (not localized). */
  name: string;
  /** → messages: `testimonios.items.<id>.role`. */
  roleKey: string;
  /** → messages: `testimonios.items.<id>.quote`. */
  quoteKey: string;
  /** Nivel badge, e.g. "07". */
  level: string;
  tone: AccentColor;
}

export const TESTIMONIALS: readonly Testimonial[] = [
  // TODO-swap: real members + consent.
  {
    id: "valeria",
    name: "Valeria Méndez",
    roleKey: "testimonios.items.valeria.role",
    quoteKey: "testimonios.items.valeria.quote",
    level: "07",
    tone: "magenta",
  },
  {
    id: "tomas",
    name: "Tomás Aguilar",
    roleKey: "testimonios.items.tomas.role",
    quoteKey: "testimonios.items.tomas.quote",
    level: "06",
    tone: "green",
  },
  {
    id: "renata",
    name: "Renata Solís",
    roleKey: "testimonios.items.renata.role",
    quoteKey: "testimonios.items.renata.quote",
    level: "05",
    tone: "orange",
  },
] as const;

/**
 * FAQ (#9) — objection-killers, rendered in the horizontal SpineAccordion. Q + A
 * COPY live in messages under `faq.items.<id>.{q,a}`. Includes the "do I need
 * to know the tech?" objection (id "jargon" — kept jargon-free per Hard rule #3;
 * the vocabulary guard also scans serialized keys, so the id avoids banned terms).
 *
 * TODO-swap: confirm/extend the question set with the operator before launch.
 */
export interface FaqItem {
  /** Stable key — also the i18n sub-namespace under `faq.items`, and spine index source. */
  id: string;
  /** Mono spine index, e.g. "01". */
  index: string;
  /** → messages: `faq.items.<id>.q`. */
  qKey: string;
  /** → messages: `faq.items.<id>.a`. */
  aKey: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  { id: "jargon", index: "01", qKey: "faq.items.jargon.q", aKey: "faq.items.jargon.a" },
  { id: "cost", index: "02", qKey: "faq.items.cost.q", aKey: "faq.items.cost.a" },
  { id: "who", index: "03", qKey: "faq.items.who.q", aKey: "faq.items.who.a" },
  { id: "level", index: "04", qKey: "faq.items.level.q", aKey: "faq.items.level.a" },
  { id: "where", index: "05", qKey: "faq.items.where.q", aKey: "faq.items.where.a" },
] as const;

/**
 * Lo último (#7) — the magazine, rendered in the vertical SpineAccordion. Each
 * post is a magazine page. v0 = a few CURATED posts → "pronto" article stubs:
 * `href` is "#" until the real magazine/blog backend lands (plan: out of scope).
 *
 * STRUCTURE here (id, href, category label, accent); title + dek COPY live in
 * messages under `latest.items.<id>.{title,dek}`.
 *
 * TODO-swap: point `href` at real article routes when the magazine ships.
 */
export interface LatestPost {
  /** Stable key — also the i18n sub-namespace under `latest.items`, and the anchor. */
  id: string;
  /** Mono spine index, e.g. "01". */
  index: string;
  /** → messages: `latest.items.<id>.title`. */
  titleKey: string;
  /** → messages: `latest.items.<id>.dek`. */
  dekKey: string;
  /** Article destination. "#" = stub until the magazine backend exists. */
  href: string;
  /** Short category label (mono eyebrow), shown verbatim. */
  category: string;
  accent: AccentColor;
  /** Byline, shown verbatim (mono). Placeholder until the magazine ships. */
  author: string;
  /** Edition/relative time line, shown verbatim (mono). Placeholder. */
  time: string;
}

export const LATEST_POSTS: readonly LatestPost[] = [
  // TODO-swap: real curated posts → real article routes (author/time real bylines).
  {
    id: "post1",
    index: "01",
    titleKey: "latest.items.post1.title",
    dekKey: "latest.items.post1.dek",
    href: "#",
    category: "Builds",
    accent: "magenta",
    author: "Redacción Frutero", // TODO-swap
    time: "ED. 07", // TODO-swap
  },
  {
    id: "post2",
    index: "02",
    titleKey: "latest.items.post2.title",
    dekKey: "latest.items.post2.dek",
    href: "#",
    category: "Eventos",
    accent: "green",
    author: "Redacción Frutero", // TODO-swap
    time: "ED. 07", // TODO-swap
  },
  {
    id: "post3",
    index: "03",
    titleKey: "latest.items.post3.title",
    dekKey: "latest.items.post3.dek",
    href: "#",
    category: "Comunidad",
    accent: "orange",
    author: "Redacción Frutero", // TODO-swap
    time: "ED. 07", // TODO-swap
  },
] as const;
