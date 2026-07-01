import { expect, test } from "@playwright/test";

import { HAS_CONVEX } from "./_env";

/**
 * /enterprise + contact E2E (T8 · plan "E2E … /enterprise, contact happy+error").
 *
 * The page is services-led (GTM, APPROVED): proven services first, then a
 * gated "talk to us" recruiting block, with one lead-capture form. The contact
 * VALIDATION path runs in the browser before the Convex mutation. The happy path
 * (real lead insert) is gated on Convex config.
 */
test.describe("/enterprise — services-led page", () => {
  test("renders the services block and a single contact form", async ({
    page,
  }) => {
    await page.goto("/enterprise");
    await expect(page.getByText(/Lo que hacemos/i)).toBeVisible();
    // Single lead-capture form.
    await expect(page.locator("form")).toHaveCount(1);
    // Recruiting is gated ("talk to us"), not a self-serve flow.
    await expect(page.getByText(/Por invitación/i)).toBeVisible();
  });

  test("paper-only — no MODO toggle on the enterprise page", async ({
    page,
  }) => {
    await page.goto("/enterprise");
    await expect(page.getByText(/MODO/i)).toHaveCount(0);
  });
});

test.describe("contact form — error paths (no creds required)", () => {
  test("shows inline validation errors when required fields are empty", async ({
    page,
  }) => {
    await page.goto("/enterprise");
    // noValidate form → submit validates in the client and shows field errors.
    await page.getByRole("button", { name: /Enviar mensaje/i }).click();
    await expect(page.getByText(/Revisa los campos/i)).toBeVisible();
  });

  test("shows a field error for an invalid email", async ({ page }) => {
    await page.goto("/enterprise");
    await page.getByLabel(/Nombre/i).fill("Ada Lovelace");
    await page.getByLabel(/Correo/i).fill("not-an-email");
    await page
      .getByLabel(/Mensaje/i)
      .fill("Queremos construir con la comunidad.");
    await page.getByRole("button", { name: /Enviar mensaje/i }).click();
    await expect(page.getByText(/Revisa los campos/i)).toBeVisible();
  });
});

test.describe("contact form — happy path (@needs-creds: Convex)", () => {
  test("persists a lead and shows the thank-you state", async ({ page }) => {
    test.skip(
      !HAS_CONVEX,
      "requires NEXT_PUBLIC_CONVEX_URL for a real lead insert",
    );
    await page.goto("/enterprise");
    await page.getByLabel(/Nombre/i).fill("Ada Lovelace");
    await page.getByLabel(/Correo/i).fill("ada@example.com");
    await page
      .getByLabel(/Mensaje/i)
      .fill("Queremos construir producto con Frutero Club.");
    await page.getByRole("button", { name: /Enviar mensaje/i }).click();
    // Success replaces the form with a status region.
    await expect(page.getByRole("status")).toContainText(/Mensaje recibido/i);
  });
});
