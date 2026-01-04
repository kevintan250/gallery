import { createContext } from 'react'
import type { Photo } from '../data/photoSets'

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
  globalMouseRef: React.MutableRefObject<{ x: number; y: number; has: boolean }>
  isEditMode: boolean
  setIsEditMode: (isEditMode: boolean) => void
  editedPhotos: Record<string, Partial<Photo>>
  updatePhotoData: (photoId: string, data: Partial<Photo>) => void
  getEditedPhoto: (photoId: string, original: Photo) => Photo
}

export const GalleryContext = createContext<GalleryContextType | null>(null)
