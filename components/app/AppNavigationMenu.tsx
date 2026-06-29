"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLogout, usePrivy } from "@privy-io/react-auth";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { api } from "@/convex/_generated/api";

type MenuItem = {
  href: "/dashboard" | "/perfil" | "/pulpa";
  label: string;
};

/** Authenticated member navigation menu for the app masthead. */
export function AppNavigationMenu() {
  const t = useTranslations("app.nav");
  const { ready, authenticated, user } = usePrivy();
  const { logout } = useLogout();
  const pathname = usePathname();
  const router = useRouter();
  const profile = useQuery(
    api.clubApp.getProfile,
    user?.id ? { privyDid: user.id } : "skip",
  );
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isOpen = open && authenticated;

  const menuItems = useMemo<MenuItem[]>(
    () => [
      { href: "/dashboard", label: t("dashboard") },
      { href: "/perfil", label: t("profile") },
      { href: "/pulpa", label: t("pulpa") },
    ],
    [t],
  );

  const displayName = profile?.user?.displayName?.trim() || t("memberFallback");
  const firstName =
    profile?.user?.firstName?.trim() || firstNameFromDisplay(displayName);
  const initials = firstName.slice(0, 2).toUpperCase();
  const profileLoading =
    authenticated && Boolean(user?.id) && profile === undefined;

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!ready || !authenticated) {
    return null;
  }

  if (profileLoading) {
    return <AppNavigationMenuPlaceholder />;
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      setOpen(false);
      clearPrivySessionMarkers();
      await logout();
      router.replace("/perfil");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("openMenu")}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-transparent px-1 pr-2.5 text-paper transition-colors hover:bg-paper/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
      >
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full bg-magenta font-display text-[11px] font-semibold leading-none text-white"
        >
          {initials}
        </span>
        <span className="max-w-28 truncate font-display text-sm font-semibold leading-none tracking-normal">
          {firstName}
        </span>
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label={t("menu")}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 border-2 border-frame bg-paper text-ink"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate font-display text-xs font-semibold text-muted-2">
              {t("signedIn")}
            </p>
            <p className="mt-1 truncate font-display text-sm font-semibold text-ink">
              {displayName}
            </p>
          </div>

          <div className="py-2">
            {menuItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 font-display text-sm font-semibold no-underline transition-colors hover:bg-surface hover:text-magenta ${
                    active ? "text-magenta" : "text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-line p-2">
            <button
              type="button"
              role="menuitem"
              disabled={loggingOut}
              onClick={handleLogout}
              className="block w-full cursor-pointer px-2 py-2.5 text-left font-display text-sm font-semibold text-ink transition-colors hover:bg-surface hover:text-magenta disabled:pointer-events-none disabled:opacity-60"
            >
              {loggingOut ? t("loggingOut") : t("logout")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function firstNameFromDisplay(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || "Member";
}

function clearPrivySessionMarkers() {
  if (typeof window === "undefined") return;

  Object.keys(window.sessionStorage).forEach((key) => {
    if (key.startsWith("privy_login_processed_")) {
      window.sessionStorage.removeItem(key);
    }
  });
}

function AppNavigationMenuPlaceholder() {
  return (
    <span
      aria-hidden
      className="inline-flex h-10 items-center gap-2 rounded-full px-1 pr-2.5"
      data-testid="app-navigation-menu-placeholder"
    >
      <span className="h-8 w-8 rounded-full bg-paper/15" />
      <span className="h-3 w-14 rounded-full bg-paper/15" />
    </span>
  );
}
