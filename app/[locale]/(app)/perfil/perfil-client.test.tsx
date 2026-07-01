import * as React from "react";
import { NextIntlClientProvider } from "next-intl";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  login: vi.fn(),
  privy: {
    ready: true,
    authenticated: false,
    user: undefined as undefined | { id: string },
  },
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@privy-io/react-auth", () => ({
  usePrivy: () => mocks.privy,
  useLogin: (callbacks?: { onComplete?: () => void }) => ({
    login: () => {
      mocks.login();
      callbacks?.onComplete?.();
    },
  }),
}));

vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    clubApp: {
      getProfile: "getProfile",
      saveProfile: "saveProfile",
    },
  },
}));

import PerfilClient from "./perfil-client";
import esPerfil from "@/messages/es/perfil.json";

function renderPerfil() {
  return render(
    <NextIntlClientProvider locale="es" messages={{ perfil: esPerfil }}>
      <PerfilClient />
    </NextIntlClientProvider>,
  );
}

describe("PerfilClient", () => {
  beforeEach(() => {
    mocks.replace.mockClear();
    mocks.login.mockClear();
    mocks.privy.ready = true;
    mocks.privy.authenticated = false;
    mocks.privy.user = undefined;
  });

  it("redirects successful login to the dashboard", async () => {
    renderPerfil();

    await userEvent.click(
      screen.getByRole("button", { name: /inicia sesión/i }),
    );

    expect(mocks.login).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith("/dashboard");
  });
});
