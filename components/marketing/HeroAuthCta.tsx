"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useTranslations } from "next-intl";

import { Glyph } from "@/components/Glyph";
import { Button } from "@/components/ui";
import { SIGNUP_HREF } from "@/content/landing";
import { Link } from "@/i18n/navigation";

/** Auth-aware primary CTA for the homepage hero. */
export function HeroAuthCta() {
  const landing = useTranslations("landing");
  const nav = useTranslations("app.nav");
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return <HeroCtaPlaceholder />;
  }

  if (authenticated) {
    return (
      <Button asChild size="md">
        <Link href="/dashboard">
          <Glyph name="star" size={13} /> {nav("dashboard")}
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild size="md">
      <Link href={SIGNUP_HREF}>
        <Glyph name="bolt" size={13} /> {landing("hero.ctaPrimary")}
      </Link>
    </Button>
  );
}

function HeroCtaPlaceholder() {
  return (
    <span
      aria-hidden
      className="block h-10 w-[9rem]"
      data-testid="hero-auth-placeholder"
    />
  );
}
