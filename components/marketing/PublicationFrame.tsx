/**
 * PublicationFrame — a persistent dark border around the viewport (thedissolve
 * style). With the {@link Masthead} (same `--frame`), the page reads as a framed
 * publication: a dark frame + dark navbar wrapping the warm-paper content. Uses
 * `--frame` (#110b1a, the dedicated dark editorial bg), NOT `--ink` (text color).
 *
 * `fixed` + `pointer-events-none` so it stays around the window as you scroll and
 * never blocks interaction; it only overlays the outer ~14px, which the content
 * gutters (`px-7`) already clear. Decorative, square corners (DESIGN.md).
 */
export function PublicationFrame() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] border-[10px] border-frame md:border-[14px]"
    />
  );
}
