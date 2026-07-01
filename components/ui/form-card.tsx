import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * FormCard — framed editorial form surface.
 *
 * Form cards stay paper-locked even when mounted inside a dark ArcadeSection:
 * the card uses the warm `bg-surface` sheet, while controls use the lighter
 * `bg-card` fill so fields read as actual inputs, not borders on a flat slab.
 */
const PAPER_FORM_VARS = {
  "--paper": "#f9f5ef",
  "--surface": "#ece6dd",
  "--card": "#fffbf5",
  "--ink": "#11091e",
  "--muted": "#5b5170",
  "--muted-2": "#8a8198",
  "--line": "#dcd3c4",
  "--black": "#08000f",
} as React.CSSProperties;

export const formControlClass =
  "w-full border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none transition-colors placeholder:text-muted-2 focus-visible:border-magenta aria-[invalid=true]:border-red";

export const formLabelClass =
  "font-mono text-xs uppercase tracking-[0.1em] text-muted-2";

export const formAlertClass =
  "border-2 border-frame bg-card px-4 py-3 font-mono text-xs";

export const formFieldErrorClass = "font-mono text-xs";

export type FormCardProps = React.HTMLAttributes<HTMLElement> & {
  as?: "article" | "div";
};

function FormCard({
  as = "article",
  className,
  style,
  ...props
}: FormCardProps) {
  const Comp = as;

  return (
    <Comp
      data-slot="form-card"
      className={cn(
        "relative w-full border-[3px] border-[var(--muted-canonical)] bg-surface",
        className,
      )}
      style={{ ...PAPER_FORM_VARS, ...style }}
      {...props}
    />
  );
}

export { FormCard };
