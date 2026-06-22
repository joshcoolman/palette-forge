import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { activeEngine, type EngineInfo } from '#/features/agent/get-engine'
import { ensureHydrated } from '#/lib/settings'

/** Small indicator of which engine is active, linking to settings. */
export function EngineBadge() {
  const [info, setInfo] = useState<EngineInfo>({ mode: 'demo' })

  useEffect(() => {
    let active = true
    void ensureHydrated().then(() => {
      if (active) setInfo(activeEngine())
    })
    return () => {
      active = false
    }
  }, [])

  const label =
    info.mode === 'claude'
      ? `Claude · ${info.model?.replace('claude-', '') ?? ''}`
      : 'Demo engine · add key'

  return (
    <Link to="/settings" className="text-xs underline" style={{ color: 'var(--app-muted)' }}>
      {label}
    </Link>
  )
}
