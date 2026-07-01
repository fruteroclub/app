"use client";

import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui";
import { Glyph } from "@/components/Glyph";
import { api } from "@/convex/_generated/api";
import { useRouter } from "@/i18n/navigation";
import { toMember } from "@/lib/member";
import PerfilForm from "./perfil-form";
import PerfilView from "./perfil-view";

/**
 * The /perfil destination — BOTH the signup entry and the profile view.
 *
 *   not ready / query pending → loading
 *   ready, !authenticated     → login CTA (opens the Privy modal)
 *   authed, no account (null) → create form
 *   authed, account exists    → the perfil view
 *
 * Data is a reactive Convex query (`api.clubApp.getProfile` by Privy DID) — no
 * manual fetch/refetch, it updates itself after a save.
 */
export default function PerfilClient() {
  const t = useTranslations("perfil");
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const { login } = useLogin({
    onComplete: () => router.replace("/dashboard"),
  });
  const data = useQuery(
    api.clubApp.getProfile,
    user?.id ? { privyDid: user.id } : "skip",
  );

  // not ready, or authed but the query hasn't resolved yet → loading.
  if (!ready || (authenticated && Boolean(user?.id) && data === undefined)) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="font-mono text-xs text-muted-2"
      >
        {t("view.loading")}
      </p>
    );
  }

  if (!authenticated) {
    return (
      <section className="mx-auto grid max-w-md justify-items-center gap-5 py-12 text-center md:py-20">
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-ink">
          {t("create.title")}
        </h1>
        <p className="max-w-[34ch] font-serif text-lg leading-[1.45] text-ink">
          {t("create.lead")}
        </p>
        <div className="mt-2">
          <Button onClick={() => login()}>
            <Glyph name="bolt" size={14} />
            {t("create.loginCta")}
          </Button>
        </div>
      </section>
    );
  }

  const member = toMember(data ?? null);

  if (!member) {
    // Authed but no account row yet → the create form, on the editorial card.
    return (
      <section className="mx-auto grid w-full max-w-2xl gap-8">
        <CreateHeader />
        <div className="border-[3px] border-frame bg-surface p-6 md:p-8">
          <PerfilForm mode="create" />
        </div>
      </section>
    );
  }

  return <PerfilView profile={member} />;
}

function CreateHeader() {
  const t = useTranslations("perfil.create");
  return (
    <header>
      <h1 className="font-display text-4xl font-semibold leading-[1.02] text-ink md:text-5xl">
        {t("title")}
      </h1>
    </header>
  );
}
