import React, { useCallback, useMemo, useRef } from 'react'
import { FlipContext, type FlipBridge, type PendingFlip } from './flipBridge'

export function FlipProvider({ children }: { children: React.ReactNode }) {
  const pendingRef = useRef<PendingFlip | null>(null)

  const setPendingFlip = useCallback((pending: PendingFlip | null) => {
    pendingRef.current = pending
  }, [])

  const consumePendingFlip = useCallback(() => {
    const value = pendingRef.current
    pendingRef.current = null
    return value
  }, [])

  const ctxValue = useMemo<FlipBridge>(
    () => ({ setPendingFlip, consumePendingFlip }),
    [consumePendingFlip, setPendingFlip],
  )

  return <FlipContext.Provider value={ctxValue}>{children}</FlipContext.Provider>
}
