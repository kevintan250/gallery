import { createContext } from 'react'

export type ClosePhase = 'idle' | 'grid-exit' | 'hero-exit'

export type GalleryContextType = {
  activeSetId: string | null
  setActiveSetId: (id: string | null) => void
  islandSetId: string | null
  setIslandSetId: (id: string | null) => void
  isTransitioning: boolean
  setIsTransitioning: (isTransitioning: boolean) => void
  closePhase: ClosePhase
  setClosePhase: (phase: ClosePhase) => void
  registerCloseHandler: (handler: () => void) => void
  requestClose: () => void
}

export const GalleryContext = createContext<GalleryContextType | null>(null)
