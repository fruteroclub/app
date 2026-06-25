import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

/**
 * Stub the locale-aware navigation. The real `@/i18n/navigation` pulls in
 * next-intl's client navigation, which imports `next/navigation` in a way Vitest's
 * jsdom ESM resolver can't load in isolation. For these render tests we only care
 * that the CTAs link to the right hrefs, so a plain anchor is sufficient. The full
 * routing behavior is covered by proxy/e2e tests (T8).
 */
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...props }, children),
  // MastheadNav reads the active route; default to home for the render tests.
  usePathname: () => "/",
}));

import { GlyphDefs } from "@/components/Glyph";
import {
  CharacterSelect,
  CommunityFrontPage,
  CtaBand,
  Hero,
  LatestMagazine,
  Masthead,
  OpportunityMarketplace,
  Pillars,
  ProofStrip,
} from "@/components/marketing";
import type { CommunityCardData } from "@/content/cards";
import { OPPORTUNITIES, PROOF_STATS, SIGNUP_HREF } from "@/content/landing";

import esCommon from "@/messages/es/common.json";
import esLanding from "@/messages/es/landing.json";
import enCommon from "@/messages/en/common.json";
import enLanding from "@/messages/en/landing.json";

const MESSAGES = {
  es: { common: esCommon, landing: esLanding },
  en: { common: enCommon, landing: enLanding },
} as const;

function renderLanding(locale: "es" | "en", ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <GlyphDefs />
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("landing — Hero", () => {
  it("renders the ES display title and serif lead", () => {
    renderLanding(
      "es",
      <>
        <Hero />
      </>,
    );
    // "Sube de" + "nivel" split across the <br/> in the display heading.
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toContain("Sube de");
    expect(h1.textContent).toContain("nivel");
    expect(screen.getByText(/reputación verificable/i)).toBeInTheDocument();
  });

  it("renders the EN display title and lead", () => {
    renderLanding("en", <Hero />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toContain("Level");
    expect(h1.textContent).toContain("up");
    expect(screen.getByText(/verifiable reputation/i)).toBeInTheDocument();
  });

  it("primary CTA points at the signup destination (/perfil)", () => {
    renderLanding("es", <Hero />);
    const primary = screen.getByRole("link", { name: /Crea tu perfil/i });
    // next-intl Link on the default locale (es) renders the bare path.
    expect(primary.getAttribute("href")).toContain(SIGNUP_HREF);
  });
});

describe("landing — Masthead (paper-only)", () => {
  it("renders brand + nav + CTA and NO MODO toggle", () => {
    renderLanding("es", <Masthead />);
    // The IBM Plex Mono wordmark span carries the brand name (the magenta
    // signature dot is a sibling span, so this element's text is exactly it).
    expect(screen.getAllByText("Frutero Club").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Cómo funciona/i }),
    ).toBeInTheDocument();
    // Paper-only public surface: the MODO toggle must not exist here.
    expect(screen.queryByText(/MODO/i)).not.toBeInTheDocument();
  });
});

describe("landing — ProofStrip (real operator numbers, no fake/placeholder path)", () => {
  it("renders every supplied proof number and flags none as pending", () => {
    // Plan rework: the null / "Pronto" flagged-placeholder path was retired in
    // favor of real-proof operator numbers. Every PROOF_STAT now carries a string
    // value, so the strip renders four numbers and no pending flags.
    const { container } = renderLanding("es", <ProofStrip />);
    const pending = container.querySelectorAll("[data-proof-pending]");
    expect(pending.length).toBe(0);
    for (const stat of PROOF_STATS) {
      expect(stat.value).not.toBeNull();
      expect(screen.getByText(stat.value as string)).toBeInTheDocument();
    }
  });
});

describe("landing — Pillars", () => {
  it("renders the three loop pillars in order", () => {
    renderLanding("es", <Pillars />);
    expect(
      screen.getByRole("heading", { name: "Construye" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Demuestra" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Desbloquea" }),
    ).toBeInTheDocument();
  });
});

describe("landing — CtaBand", () => {
  it("closing CTA points at /perfil", () => {
    renderLanding("es", <CtaBand />);
    const cta = screen.getByRole("link", { name: /Crea tu perfil/i });
    expect(cta.getAttribute("href")).toContain(SIGNUP_HREF);
  });
});

describe("landing — OpportunityMarketplace (#5)", () => {
  it("lists the 5 open opportunities + the Publica aquí ad slot", () => {
    renderLanding("es", <OpportunityMarketplace />);

    // Five real listings.
    expect(OPPORTUNITIES).toHaveLength(5);
    expect(
      screen.getByRole("heading", { name: /Build in Public semanal/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Estadía ETH Cinco de Mayo/i }),
    ).toBeInTheDocument();

    // The count header + the sponsor "empty" slot.
    expect(screen.getByText("5 Oportunidades Abiertas")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Publica aquí$/i }),
    ).toBeInTheDocument();
  });

  it("only ETH Cinco de Mayo is uncommon; everything else is common", () => {
    const uncommon = OPPORTUNITIES.filter((o) => o.rarity === "uncommon");
    expect(uncommon.map((o) => o.id)).toEqual(["eth-stay"]);
    expect(
      OPPORTUNITIES.filter((o) => o.rarity !== "common" && o.id !== "eth-stay"),
    ).toHaveLength(0);
  });
});

describe("landing — vocabulary guard (Hard rule #3)", () => {
  // "blockchain" is intentionally NOT banned — it's a technology and we're
  // tech-forward (titles, articles, event names like "AI x Blockchain Day").
  // The guard keeps out the crypto-bro register: onchain / web3 / crypto.
  const banned = /\bonchain\b|\bweb3\b|\bcrypto\b/i;

  it("ES landing copy never says onchain/web3/crypto", () => {
    expect(JSON.stringify(esLanding)).not.toMatch(banned);
  });

  it("EN landing copy never says onchain/web3/crypto", () => {
    expect(JSON.stringify(enLanding)).not.toMatch(banned);
  });

  it('leads with "verifiable / verificable"', () => {
    expect(JSON.stringify(esLanding)).toMatch(/verificable/i);
    expect(JSON.stringify(enLanding)).toMatch(/verifiable/i);
  });
});

describe('landing — Leaderboard character-select makes no fake "live" claim', () => {
  it("does not label the static $PULPA snapshot as EN VIVO / LIVE", () => {
    // The #8 Leaderboard is the CharacterSelect cabinet: a roster ranked by $PULPA
    // (a snapshot until the onchain indexer is live) → a featured builder + the
    // `Habla con su Agente` CTA. $PULPA is illustrative for now, so the cabinet must
    // not claim a live feed anywhere.
    const { container } = renderLanding("es", <CharacterSelect />);
    expect(within(container).queryByText(/EN VIVO/i)).not.toBeInTheDocument();
    expect(within(container).queryByText(/\bLIVE\b/i)).not.toBeInTheDocument();
  });

  it("opens a builder from the grid and links the Agent CTA to /perfil/<id>", async () => {
    const { container } = renderLanding("es", <CharacterSelect />);
    // First view is the roster grid (no CTA yet). Opening the top builder (Andrés,
    // 2,540) runs the clear→load transition, so the profile + CTA appear async.
    fireEvent.click(within(container).getByRole("button", { name: /Andrés Frutero/i }));
    const cta = await within(container).findByRole("link", { name: /Habla con su Agente/i });
    expect(cta).toHaveAttribute("href", "/perfil/andres");
  });
});

describe("landing — Lo último #7 + hero rail (T4 repoint to latest())", () => {
  const cards: CommunityCardData[] = [
    {
      id: "2026-06-22-alpha",
      category: "Logro",
      topic: "Monad",
      accent: "magenta",
      glyph: "star",
      collector: "001/120",
      title: "Alpha headline",
      dek: "Alpha dek",
      author: "Redacción",
      time: "22 JUN 2026",
      stat: "@frutero",
    },
    {
      id: "2026-06-20-bravo",
      category: "Evento",
      topic: "CDMX",
      accent: "green",
      glyph: "star",
      collector: "002/120",
      title: "Bravo headline",
      author: "A. Frutero",
      time: "20 JUN 2026",
      stat: "@aldo",
    },
  ];

  it("LatestMagazine links each page CTA to its /noticias/<slug> route (ES apex)", () => {
    const { container } = renderLanding(
      "es",
      <LatestMagazine posts={cards} localePrefix="" />,
    );
    const hrefs = Array.from(container.querySelectorAll('a[href^="/noticias/"]')).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/noticias/2026-06-22-alpha");
    expect(hrefs).toContain("/noticias/2026-06-20-bravo");
  });

  it("LatestMagazine locale-prefixes the hrefs for EN", () => {
    const { container } = renderLanding(
      "en",
      <LatestMagazine posts={cards} localePrefix="/en" />,
    );
    const hrefs = Array.from(container.querySelectorAll('a[href^="/en/noticias/"]')).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/en/noticias/2026-06-22-alpha");
  });

  it("LatestMagazine renders the 'pronto' empty state with zero posts", () => {
    renderLanding("es", <LatestMagazine posts={[]} localePrefix="" />);
    expect(screen.getByText(/Pronto\. La comunidad/i)).toBeInTheDocument();
  });

  it("CommunityFrontPage rail items DEEP-LINK into #lo-ultimo (#<slug>), not the article URL", () => {
    const { container } = renderLanding("es", <CommunityFrontPage posts={cards} />);
    // The rail opens the matching tab in the on-page Lo último reader.
    expect(container.querySelector('a[href="#2026-06-22-alpha"]')).not.toBeNull();
    // It must NOT navigate away to the full article route.
    expect(container.querySelector('a[href="/noticias/2026-06-22-alpha"]')).toBeNull();
    // "Ver todo" still scrolls to the section.
    expect(container.querySelector('a[href="#lo-ultimo"]')).not.toBeNull();
  });

  it("CommunityFrontPage renders the empty state with zero posts", () => {
    renderLanding("es", <CommunityFrontPage posts={[]} />);
    expect(screen.getByText(/Pronto\. La comunidad/i)).toBeInTheDocument();
  });
});
