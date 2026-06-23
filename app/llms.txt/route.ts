import { SITE_URL, SITE_NAME } from '@/lib/seo'
import { getAllArticles } from '@/lib/content/articles'

/**
 * /llms.txt (T5 / DEC-8, minimal) — a plain-text map of the news section for LLM
 * crawlers. Root route (no locale segment) → emits the canonical bare-apex (ES)
 * URLs. force-static: built from the content corpus at build time. AEO is hygiene,
 * not the leverage (DEC-8) — this is the minimal, honest version.
 */
export const dynamic = 'force-static'

export async function GET() {
  const articles = await getAllArticles('es')

  const lines = [
    `# ${SITE_NAME}`,
    '',
    '> Aceleradora de talento: reputación verificable y oportunidades reales para builders de LatAm.',
    '',
    '## Noticias',
    `- [Noticias](${SITE_URL}/noticias): índice editorial — logros, eventos, guías y bitácoras de la comunidad.`,
    ...articles.map(
      (a) =>
        `- [${a.meta.title}](${SITE_URL}/noticias/${a.meta.slug})` +
        (a.meta.dek ? `: ${a.meta.dek}` : ''),
    ),
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
