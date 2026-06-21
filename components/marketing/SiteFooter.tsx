import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * SiteFooter (#11) — editorial footer on warm PAPER (FLAT, ink text). The brand
 * wordmark in masthead proportions (font ink + magenta dot) plus the community's
 * social links — Farcaster · X · Telegram · GitHub, all @fruteroclub (info from
 * the sibling frutero-current-app). Framed top by the 2px ink publication rule.
 *
 * Server component; static. Social marks are brand glyphs, inlined as SVG paths.
 */

interface Social {
  name: string;
  href: string;
  viewBox: string;
  path: string;
  evenOdd?: boolean;
}

const SOCIALS: readonly Social[] = [
  {
    name: "Farcaster",
    href: "https://warpcast.com/~/channel/fruteroclub",
    viewBox: "0 0 24 24",
    path: "M18.24 0.24H5.76C2.5789 0.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6c0-3.1812-2.5788-5.76-5.76-5.76zm.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0098 4.3578c.2276.0424.5063.2197.5063.4647v.504c.2868-.0256.5457.1905.5438.479v.5688H5.1075v-.5688c-.0019-.2885.2576-.5047.5444-.479v-.504c0-.2147.1454-.3923.3445-.4518V9.4863H5.4859l-.3417-1.1567h2.0644V6.4598h9.5025v1.8698h2.0644l-.3417 1.1567h-.5105v8.2754c.1991.0595.3445.2371.3445.4518z",
  },
  {
    name: "X",
    href: "https://twitter.com/fruteroclub",
    viewBox: "0 0 24 24",
    path: "M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z",
  },
  {
    name: "Telegram",
    href: "https://t.me/fruteroclub",
    viewBox: "0 0 24 24",
    path: "M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z",
  },
  {
    name: "GitHub",
    href: "https://github.com/fruteroclub",
    viewBox: "0 0 24 24",
    evenOdd: true,
    path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
  },
];

export function SiteFooter() {
  const t = useTranslations("landing");
  const brand = t("footer.left");

  return (
    <footer className="border-t-2 border-ink">
      <div className="mx-auto max-w-[var(--wrap)] px-7 py-10">
        {/* Brand wordmark (masthead proportions) + social links */}
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand lockup — symmetric with the masthead (logo mark + wordmark) */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              width={36}
              height={36}
              alt=""
              className="flex-none"
            />
            <span className="font-mono text-xl font-bold leading-none tracking-[-0.01em] text-ink">
              {brand}
              <span className="text-magenta">.</span>
            </span>
          </div>

          <nav className="flex items-center gap-5" aria-label="Redes sociales">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="text-muted-2 transition-colors hover:text-magenta"
              >
                <svg
                  viewBox={s.viewBox}
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d={s.path} fillRule={s.evenOdd ? "evenodd" : undefined} />
                </svg>
              </a>
            ))}
          </nav>
        </div>

        {/* Closing bar — ENCLOSED in a bold frame-colored border (like the stats
            statement section), 3 cells, all frame-colored text:
              · tagline (Bitter, magenta ending dot — like the hero)
              · identity (Petrona serif, the briefest "what is Frutero Club")
              · copyright (IBM Plex Mono). */}
        <div className="mt-8 grid grid-cols-1 gap-px border-2 border-frame bg-frame text-center sm:grid-cols-3">
          <div className="flex items-center justify-center bg-paper px-5 py-1 font-display text-sm tracking-[-0.01em] text-frame">
            {t("footer.right")}
            <span className="text-magenta" aria-hidden>
              .
            </span>
          </div>
          <div className="flex items-center justify-center bg-paper px-5 py-1 font-display text-sm tracking-[-0.01em] text-frame">
            {t("footer.center")}
          </div>
          <div className="flex items-center justify-center bg-paper px-5 py-1 font-display text-sm tracking-[-0.01em] text-frame">
            © 2026 Frutero
          </div>
        </div>
      </div>
    </footer>
  );
}
