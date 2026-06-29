import * as React from "react";
import { NextIntlClientProvider } from "next-intl";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logout: vi.fn(async () => undefined),
  replace: vi.fn(),
  pathname: "/dashboard",
  profile: {
    user: {
      firstName: "Mel",
      displayName: "Mel Frutero",
    },
  } as undefined | { user: { firstName: string; displayName: string } },
  privy: {
    ready: true,
    authenticated: true,
    user: {
      id: "did:privy:test",
      email: { address: "member@frutero.club" },
      wallet: undefined,
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: () => mocks.profile,
}));

vi.mock("@/convex/_generated/api", () => ({
  api: { clubApp: { getProfile: "getProfile" } },
}));

vi.mock("@privy-io/react-auth", () => ({
  useLogout: () => ({ logout: mocks.logout }),
  usePrivy: () => mocks.privy,
}));

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
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));

import { AppNavigationMenu } from "@/components/app/AppNavigationMenu";
import esApp from "@/messages/es/app.json";

function renderMenu() {
  return render(
    <NextIntlClientProvider locale="es" messages={{ app: esApp }}>
      <AppNavigationMenu />
    </NextIntlClientProvider>,
  );
}

describe("AppNavigationMenu", () => {
  beforeEach(() => {
    mocks.logout.mockClear();
    mocks.replace.mockClear();
    mocks.pathname = "/dashboard";
    mocks.profile = {
      user: {
        firstName: "Mel",
        displayName: "Mel Frutero",
      },
    };
    mocks.privy.ready = true;
    mocks.privy.authenticated = true;
  });

  it("renders nothing until the user is authenticated", () => {
    mocks.privy.authenticated = false;

    renderMenu();

    expect(
      screen.queryByRole("button", { name: /abrir menú de navegación/i }),
    ).not.toBeInTheDocument();
  });

  it("does not expose the auth email while the profile query is loading", () => {
    mocks.profile = undefined;

    renderMenu();

    expect(
      screen.queryByRole("button", { name: /abrir menú de navegación/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("member@frutero.club")).not.toBeInTheDocument();
  });

  it("opens authenticated navigation links", async () => {
    renderMenu();

    expect(
      screen.getByRole("button", { name: /abrir menú/i }),
    ).toHaveTextContent("Mel");

    await userEvent.click(
      screen.getByRole("button", { name: /abrir menú de navegación/i }),
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Tablero" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("menuitem", { name: "Perfil" })).toHaveAttribute(
      "href",
      "/perfil",
    );
    expect(
      screen.queryByRole("menuitem", { name: "Editar perfil" }),
    ).toBeNull();
    expect(screen.getByRole("menuitem", { name: "$PULPA" })).toHaveAttribute(
      "href",
      "/pulpa",
    );
  });

  it("logs out and returns to the signup route", async () => {
    renderMenu();

    await userEvent.click(
      screen.getByRole("button", { name: /abrir menú de navegación/i }),
    );
    await userEvent.click(
      screen.getByRole("menuitem", { name: /cerrar sesión/i }),
    );

    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith("/perfil");
  });
});
