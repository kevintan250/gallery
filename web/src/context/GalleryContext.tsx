import { useCallback, useRef, useState, type ReactNode } from 'react'
import { GalleryContext, type ClosePhase } from './GalleryContextCore'

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [activeSetId, setActiveSetIdState] = useState<string | null>(null)
  const [islandSetId, setIslandSetId] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [closePhase, setClosePhase] = useState<ClosePhase>('idle')
  const closeHandlerRef = useRef<(() => void) | null>(null)

  const setActiveSetId = useCallback(
    (id: string | null) => {
      setActiveSetIdState(id)
      if (id) {
        setIslandSetId(id)
      } else if (closePhase === 'idle') {
        setIslandSetId(null)
      }
    },
    [closePhase],
  )

  const registerCloseHandler = useCallback((handler: () => void) => {
    closeHandlerRef.current = handler
  }, [])

  const requestClose = useCallback(() => {
    if (closeHandlerRef.current) {
      closeHandlerRef.current()
    } else {
      setActiveSetId(null)
    }
  }, [setActiveSetId])

  return (
    <GalleryContext.Provider
      value={{
        activeSetId,
        setActiveSetId,
        islandSetId,
        setIslandSetId,
        isTransitioning,
        setIsTransitioning,
        closePhase,
        setClosePhase,
        registerCloseHandler,
        requestClose,
      }}
    >
      {children}
    </GalleryContext.Provider>
  )
}
