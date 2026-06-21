import * as React from 'react'

import { cn } from '@/lib/utils'

/** Clamp an arbitrary number into the inclusive 0–100 percentage range. */
export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

export interface ProgressBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role' | 'children'> {
  /** Progress 0–100. Values outside the range are clamped. */
  value: number
  /** Fill color CSS value. Defaults to the magenta primary. */
  fill?: string
  /** Accessible label for the progress track. */
  label?: string
}

/**
 * ProgressBar — the thin XP / reputation meter from twin-profile.html (`.bar`).
 *
 * 7px tall, surface track, 1px ink border, square. The fill (`.bar i`) is magenta
 * by default; pass `fill="var(--green)"` etc. for the per-dimension meters.
 * `value` is always clamped to 0–100 so callers can pass raw ratios safely.
 */
function ProgressBar({
  value,
  fill = 'var(--magenta)',
  label,
  className,
  ...props
}: ProgressBarProps) {
  const pct = clampPercent(value)
  return (
    <div
      data-slot="progress-bar"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        'h-[7px] overflow-hidden border border-ink bg-surface',
        className,
      )}
      {...props}
    >
      <span
        data-slot="progress-bar-fill"
        className="block h-full"
        style={{ width: `${pct}%`, background: fill }}
      />
    </div>
  )
}

export { ProgressBar }
