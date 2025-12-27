import { createContext, useContext } from 'react'
import { Flip } from 'gsap/all'

export type PendingFlip = {
  state: ReturnType<typeof Flip.getState>
  flipId: string
}

export type FlipBridge = {
  setPendingFlip: (pending: PendingFlip | null) => void
  consumePendingFlip: () => PendingFlip | null
}

export const FlipContext = createContext<FlipBridge | null>(null)

export function useFlipBridge(): FlipBridge {
  const ctx = useContext(FlipContext)
  if (!ctx) throw new Error('useFlipBridge must be used within FlipProvider')
  return ctx
}
