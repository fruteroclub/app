/**
 * Renders a JSON-LD structured-data block. Next.js recommends emitting
 * `application/ld+json` as a plain <script> with stringified JSON (it is data,
 * not executable code, so `dangerouslySetInnerHTML` is the sanctioned pattern).
 *
 * Server component — the markup is static and rendered into the document.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here (no user input); guard the closing
      // tag just in case a string field ever contains "</script>".
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
