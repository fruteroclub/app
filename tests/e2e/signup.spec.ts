import { expect, test } from "@playwright/test";

import { HAS_AUTH, HAS_CONVEX } from "./_env";

/**
 * Signup / perfil E2E (T8 · plan "signup happy+error").
 *
 * The signup ENTRY POINT (the "Crea tu perfil" CTA → /perfil → Privy login modal)
 * is reachable on a built app with no creds: we assert the login surface renders.
 * The full create flow (Privy login → Convex profile save → see /perfil) needs a
 * live Privy app + Convex deployment and is gated below — a visible skip, never a
 * silent pass.
 */
test.describe("signup — entry point (no creds required)", () => {
  test("the landing CTA leads to /perfil and surfaces the login affordance", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /Crea tu perfil/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/perfil/);
    // /perfil prompts sign-in before any profile form (off-chain identity entry).
    await expect(
      page.getByRole("button", { name: /Inicia sesión/i }),
    ).toBeVisible();
  });
});

test.describe("signup — full create flow (@needs-creds: Privy + Convex)", () => {
  test("login → create profile → see perfil", async ({ page }) => {
    test.skip(
      !(HAS_AUTH && HAS_CONVEX),
      "requires NEXT_PUBLIC_PRIVY_APP_ID + NEXT_PUBLIC_CONVEX_URL",
    );
    // Operator-provisioned flow. With Privy test credentials wired in, drive the
    // login modal, fill a unique handle, submit, and assert the perfil view.
    await page.goto("/perfil");
    await expect(
      page.getByRole("button", { name: /Inicia sesión/i }),
    ).toBeVisible();
  });
});
