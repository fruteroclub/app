import type { GlyphName } from "@/components/Glyph";

import type { AccentColor } from "./landing";

/**
 * Community publications — the front-page feed ("Lo que envió la comunidad"),
 * laid out IEEE-Spectrum-style: a lead story (the first item) + a hairline list of
 * the rest. Each is a dispatch the community shipped: a Logro (achievement),
 * Evento, Noticia, Guía, or Bitácora.
 *
 * Two-part category eyebrow (Spectrum pattern): `category` is the TYPE (muted) and
 * `topic` is the subject (in the accent color). ILLUSTRATIVE curated content for v0
 * (no live feed yet): titles/authors inline, ES-first, properly accented. Real
 * submissions + real thumbnails swap in later; covers are a CSS duotone block until
 * then (see {@link duotone}).
 *
 * Accent convention (DESIGN.md per-dimension): achievements/guides/news = magenta,
 * Eventos = green, Mentoría/becas = orange.
 */
export interface CommunityCardData {
  id: string;
  /** TYPE label (muted eyebrow), e.g. "Logro", "Evento", "Noticia", "Guía". */
  category: string;
  /** Subject (accent-colored eyebrow), e.g. "Monad", "CDMX". */
  topic: string;
  accent: AccentColor;
  glyph: GlyphName;
  /** Collector index, e.g. "044/120". */
  collector: string;
  title: string;
  /** Lead-story dek (only the featured item shows it). */
  dek?: string;
  author: string;
  /** Publication time, e.g. "HACE 2 H" or "06 JUN". */
  time: string;
  /** One mono stat, e.g. "NIVEL 06", "+219", "7 MIN". */
  stat: string;
}

export const COMMUNITY_CARDS: readonly CommunityCardData[] = [
  {
    id: "mariana-audit",
    category: "Logro",
    topic: "Monad",
    accent: "magenta",
    glyph: "star",
    collector: "001/120",
    title: "Mariana Ríos cerró su primer audit en Monad y subió a Nivel 06",
    dek: "De un bot de remesas a un mercado onchain. Subió de nivel auditando en público, y la comunidad lo vio en vivo.",
    author: "Redacción",
    time: "HACE 5 H",
    stat: "NIVEL 06",
  },
  {
    id: "erc8004-gemelo",
    category: "Guía",
    topic: "Onchain",
    accent: "magenta",
    glyph: "hex",
    collector: "044/120",
    title: "ERC-8004 y tu gemelo verificable, explicado sin humo",
    author: "V. Cruz",
    time: "HACE 2 H",
    stat: "7 MIN",
  },
  {
    id: "demo-night-06",
    category: "Evento",
    topic: "CDMX",
    accent: "green",
    glyph: "star",
    collector: "058/120",
    title: "Crónica: la Demo Night 06 fue un lleno total",
    author: "A. Frutero",
    time: "06 JUN",
    stat: "+219",
  },
  {
    id: "codigo-postal",
    category: "Noticia",
    topic: "Comunidad",
    accent: "magenta",
    glyph: "diamond",
    collector: "072/120",
    title: "El siguiente nivel no debería depender de tu código postal",
    author: "M. Ríos",
    time: "04 JUN",
    stat: "+176",
  },
  {
    id: "beca-gas",
    category: "Bitácora",
    topic: "Onboarding",
    accent: "orange",
    glyph: "grid",
    collector: "091/120",
    title: "Mi primer deploy con beca de gas: la bitácora completa",
    author: "D. Romero",
    time: "30 JUN",
    stat: "NIVEL 04",
  },
  {
    id: "whitepaper-20min",
    category: "Guía",
    topic: "Research",
    accent: "magenta",
    glyph: "search",
    collector: "103/120",
    title: "Cómo leemos un whitepaper en 20 minutos",
    author: "V. Cruz",
    time: "28 JUN",
    stat: "5 MIN",
  },
] as const;
