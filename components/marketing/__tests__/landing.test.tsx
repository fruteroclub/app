import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(async () => undefined),
  profile: {
    user: {
      firstName: "Mel",
      displayName: "Mel Frutero",
    },
  } as undefined | { user: { firstName: string; displayName: string } },
  launchStats: {
    activeBuilders: 12,
    projects: 4,
    events: 100,
    opportunities: 5,
  },
  testimonials: Array.from({ length: 6 }, (_, index) => ({
    id: `testimonial-${index + 1}`,
    userId: `user-${index + 1}`,
    username: `builder${index + 1}`,
    name: `Builder ${index + 1}`,
    role: "tecnologia",
    city: "CDMX",
    country: "México",
    testimony: `Testimonio vivo ${index + 1}`,
  })),
  privy: {
    ready: true,
    authenticated: false,
    user: {
      id: "did:privy:test",
      email: { address: "member@frutero.club" },
      wallet: undefined,
    },
  },
}));

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
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@privy-io/react-auth", () => ({
  PrivyProvider: ({ children }: { children: React.ReactNode }) => children,
  useLogout: () => ({ logout: authMocks.logout }),
  usePrivy: () => authMocks.privy,
}));

vi.mock("convex/react", () => ({
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  ConvexReactClient: class ConvexReactClient {},
  useQuery: (queryRef: string) =>
    queryRef === "getLaunchStats"
      ? authMocks.launchStats
      : queryRef === "getRandomTestimonials"
        ? authMocks.testimonials
        : authMocks.profile,
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    clubApp: {
      getProfile: "getProfile",
      getLaunchStats: "getLaunchStats",
      getRandomTestimonials: "getRandomTestimonials",
    },
  },
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
  PlayerCards,
  ProofStrip,
} from "@/components/marketing";
import type { CommunityCardData } from "@/content/cards";
import { OPPORTUNITIES, PROOF_STATS, SIGNUP_HREF } from "@/content/landing";

import esCommon from "@/messages/es/common.json";
import esLanding from "@/messages/es/landing.json";
import esApp from "@/messages/es/app.json";
import esPerfil from "@/messages/es/perfil.json";
import enCommon from "@/messages/en/common.json";
import enLanding from "@/messages/en/landing.json";
import enApp from "@/messages/en/app.json";
import enPerfil from "@/messages/en/perfil.json";

const MESSAGES = {
  es: { common: esCommon, landing: esLanding, app: esApp, perfil: esPerfil },
  en: { common: enCommon, landing: enLanding, app: enApp, perfil: enPerfil },
} as const;

function renderLanding(locale: "es" | "en", ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <GlyphDefs />
      {ui}
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  authMocks.logout.mockClear();
  authMocks.privy.ready = true;
  authMocks.privy.authenticated = false;
  authMocks.profile = {
    user: {
      firstName: "Mel",
      displayName: "Mel Frutero",
    },
  };
});

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

  it("does not flash the signup CTA while hero auth state is resolving", () => {
    authMocks.privy.ready = false;

    renderLanding("es", <Hero />);

    expect(
      screen.queryByRole("link", { name: /Crea tu perfil/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Tablero/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-auth-placeholder")).toBeInTheDocument();
  });

  it("shows the dashboard CTA in the hero when authenticated", () => {
    authMocks.privy.authenticated = true;

    renderLanding("es", <Hero />);

    expect(
      screen.queryByRole("link", { name: /Crea tu perfil/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tablero/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
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
    ).toHaveAttribute("href", "/#como-funciona");
    expect(
      screen.getByRole("link", { name: /Oportunidades/i }),
    ).toHaveAttribute("href", "/#oportunidades");
    expect(screen.getByRole("link", { name: /^Empresas$/i })).toHaveAttribute(
      "href",
      "/enterprise",
    );
    // Paper-only public surface: the MODO toggle must not exist here.
    expect(screen.queryByText(/MODO/i)).not.toBeInTheDocument();
  });

  it("does not flash the signup CTA while auth state is resolving", () => {
    authMocks.privy.ready = false;

    renderLanding("es", <Masthead />);

    expect(
      screen.queryByRole("link", { name: /Crea tu perfil/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /abrir menú de navegación/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("masthead-auth-placeholder")).toBeInTheDocument();
  });

  it("does not show the auth email while the member profile is loading", () => {
    authMocks.privy.authenticated = true;
    authMocks.profile = undefined;

    renderLanding("es", <Masthead />);

    expect(
      screen.queryByRole("link", { name: /Crea tu perfil/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("member@frutero.club")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("app-navigation-menu-placeholder"),
    ).toBeInTheDocument();
  });

  it("replaces the signup CTA with the member menu when authenticated", () => {
    authMocks.privy.authenticated = true;

    renderLanding("es", <Masthead />);

    expect(
      screen.queryByRole("link", { name: /Crea tu perfil/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /abrir menú de navegación/i }),
    ).toHaveTextContent("Mel");

    fireEvent.click(
      screen.getByRole("button", { name: /abrir menú de navegación/i }),
    );

    expect(
      screen.queryByRole("menuitem", { name: "Editar perfil" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Perfil" })).toHaveAttribute(
      "href",
      "/perfil",
    );
  });
});

describe("landing — ProofStrip (real operator numbers, no fake/placeholder path)", () => {
  it("renders the Convex-backed launch stats and flags none as pending", () => {
    const { container } = renderLanding("es", <ProofStrip />);
    const pending = container.querySelectorAll("[data-proof-pending]");
    expect(pending.length).toBe(0);

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("100+")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Oportunidades")).toBeInTheDocument();
    expect(PROOF_STATS.map((stat) => stat.i18nKey)).toEqual([
      "proof.builders",
      "proof.projects",
      "proof.events",
      "proof.unlocks",
    ]);
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
  it("uses the oportunidades anchor targeted by the masthead nav", () => {
    const { container } = renderLanding("es", <OpportunityMarketplace />);

    expect(container.querySelector("#oportunidades")).not.toBeNull();
    expect(container.querySelector("#desbloquea")).toBeNull();
  });

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
    expect(
      screen.queryByRole("link", { name: /Explora el marketplace/i }),
    ).not.toBeInTheDocument();
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

describe("landing — PlayerCards testimonials", () => {
  it("renders six Convex-backed member testimonials", () => {
    const { container } = renderLanding("es", <PlayerCards />);

    expect(container.querySelectorAll("article")).toHaveLength(6);
    expect(screen.getByText("Builder 1")).toBeInTheDocument();
    expect(screen.getByText(/Testimonio vivo 1/)).toBeInTheDocument();
    expect(screen.getAllByText("Tecnología")).toHaveLength(6);
    expect(screen.queryByText("@builder1")).not.toBeInTheDocument();

    const firstCard = container.querySelector("article");
    const firstCardHeader = firstCard?.querySelector("img")?.parentElement;
    expect(firstCardHeader).toHaveTextContent("Builder 1");
    expect(firstCardHeader).not.toHaveTextContent("Tecnología");
    expect(screen.queryByText("Andrés Frutero")).not.toBeInTheDocument();
  });

  it("does not flash fake fallback players while testimonials load", () => {
    const previous = authMocks.testimonials;
    (authMocks as { testimonials: unknown }).testimonials = undefined;

    try {
      const { container } = renderLanding("es", <PlayerCards />);

      expect(container.querySelectorAll("article")).toHaveLength(6);
      expect(screen.queryByText("Andrés Frutero")).not.toBeInTheDocument();
      expect(screen.queryByText("Mariana Ríos")).not.toBeInTheDocument();
      expect(screen.getAllByText("???")).toHaveLength(6);
      expect(screen.getAllByText(/Por desbloquear/)).toHaveLength(6);
    } finally {
      authMocks.testimonials = previous;
    }
  });
});

describe('landing — Leaderboard character-select makes no fake "live" claim', () => {
  it("renders locked slots instead of mock builders, scores, or profile links", () => {
    const { container } = renderLanding("es", <CharacterSelect />);

    expect(within(container).queryByText(/EN VIVO/i)).not.toBeInTheDocument();
    expect(within(container).queryByText(/\bLIVE\b/i)).not.toBeInTheDocument();
    expect(
      within(container).getByText(/Ranking en desarrollo/i),
    ).toBeInTheDocument();
    expect(
      within(container).queryByText(/Andrés Frutero/i),
    ).not.toBeInTheDocument();
    expect(within(container).queryByText(/2,540/i)).not.toBeInTheDocument();
    expect(within(container).queryByText(/12,480/i)).not.toBeInTheDocument();
    expect(
      within(container).queryByRole("link", { name: /Habla con su Agente/i }),
    ).not.toBeInTheDocument();
    expect(
      within(container).queryByRole("link", { name: /Próximamente/i }),
    ).not.toBeInTheDocument();

    const hiddenSlots = within(container).getAllByRole("button", {
      name: /Slot oculto/i,
    });
    expect(hiddenSlots).toHaveLength(6);
    expect(hiddenSlots[0]).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(hiddenSlots[0]);
    expect(
      within(container).queryByRole("link", { name: /Próximamente/i }),
    ).not.toBeInTheDocument();
    expect(
      within(container).getByRole("link", {
        name: /Ver hoja de ruta \$PULPA/i,
      }),
    ).toHaveAttribute("href", "/pulpa");
    expect(within(container).getAllByText("???").length).toBeGreaterThanOrEqual(
      6,
    );
    expect(within(container).getAllByText("--").length).toBeGreaterThanOrEqual(
      6,
    );
  });

  it("localizes the locked roster state in English", () => {
    const { container } = renderLanding("en", <CharacterSelect />);

    expect(
      within(container).getByText(/Ranking in development/i),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("link", {
        name: /View \$PULPA roadmap/i,
      }),
    ).toHaveAttribute("href", "/pulpa");
    expect(
      within(container).getAllByRole("button", { name: /Hidden slot/i }),
    ).toHaveLength(6);
    expect(
      within(container).queryByRole("link", { name: /Talk to their Agent/i }),
    ).not.toBeInTheDocument();
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
    const hrefs = Array.from(
      container.querySelectorAll('a[href^="/noticias/"]'),
    ).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/noticias/2026-06-22-alpha");
    expect(hrefs).toContain("/noticias/2026-06-20-bravo");
  });

  it("LatestMagazine locale-prefixes the hrefs for EN", () => {
    const { container } = renderLanding(
      "en",
      <LatestMagazine posts={cards} localePrefix="/en" />,
    );
    const hrefs = Array.from(
      container.querySelectorAll('a[href^="/en/noticias/"]'),
    ).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/en/noticias/2026-06-22-alpha");
  });

  it("LatestMagazine renders the 'pronto' empty state with zero posts", () => {
    renderLanding("es", <LatestMagazine posts={[]} localePrefix="" />);
    expect(screen.getByText(/Pronto\. La comunidad/i)).toBeInTheDocument();
  });

  it("CommunityFrontPage rail items DEEP-LINK into #lo-ultimo (#<slug>), not the article URL", () => {
    const { container } = renderLanding(
      "es",
      <CommunityFrontPage posts={cards} />,
    );
    // The rail opens the matching tab in the on-page Lo último reader.
    expect(
      container.querySelector('a[href="#2026-06-22-alpha"]'),
    ).not.toBeNull();
    // It must NOT navigate away to the full article route.
    expect(
      container.querySelector('a[href="/noticias/2026-06-22-alpha"]'),
    ).toBeNull();
    // "Ver todo" still scrolls to the section.
    expect(container.querySelector('a[href="#lo-ultimo"]')).not.toBeNull();
  });

  it("CommunityFrontPage renders the empty state with zero posts", () => {
    renderLanding("es", <CommunityFrontPage posts={[]} />);
    expect(screen.getByText(/Pronto\. La comunidad/i)).toBeInTheDocument();
  });
});
