'use client'

import { useState } from 'react'

import { Button } from '@/components/ui'

/**
 * ModeToggle — flips html[data-mode] between paper and arcade for the design
 * demo ONLY. The PUBLIC marketing pages are paper-only (D-mode, LOCKED) and ship
 * no MODO toggle; arcade lives in the authed (app) dopamine screens. T7 owns the
 * production no-flash theme script for (app); this is a local demo affordance.
 */
export function ModeToggle({ scopeId }: { scopeId: string }) {
  const [mode, setMode] = useState<'paper' | 'arcade'>('paper')

  function toggle() {
    const next = mode === 'paper' ? 'arcade' : 'paper'
    setMode(next)
    const el = document.getElementById(scopeId)
    if (el) el.setAttribute('data-mode', next)
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} type="button">
      MODO · {mode}
    </Button>
  )
}
