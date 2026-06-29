"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useTranslations } from "next-intl";

import { AppNavigationMenu } from "@/components/app/AppNavigationMenu";
import { Glyph } from "@/components/Glyph";
import { Button } from "@/components/ui";
import { SIGNUP_HREF } from "@/content/landing";
import { Link } from "@/i18n/navigation";

/**
 * Auth-aware masthead action for public pages.
 *
 * Public visitors see the normal signup CTA. Authenticated members see the same
 * avatar/name navigation menu used in the app masthead.
 */
export function MastheadAuthAction() {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return <MastheadActionPlaceholder />;
  }

  if (ready && authenticated) {
    return <AppNavigationMenu />;
  }

  return <SignupCta />;
}

function SignupCta() {
  const t = useTranslations("landing");

  return (
    <Button asChild onDark>
      <Link href={SIGNUP_HREF}>
        <Glyph name="bolt" size={13} /> {t("hero.ctaPrimary")}
      </Link>
    </Button>
  );
}

function MastheadActionPlaceholder() {
  return (
    <span
      aria-hidden
      className="block h-10 w-[10.5rem]"
      data-testid="masthead-auth-placeholder"
    />
  );
}
