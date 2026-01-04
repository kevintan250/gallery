import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { GalleryContext, type ClosePhase } from './GalleryContextCore'

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [activeSetId, setActiveSetIdState] = useState<string | null>(null)
  const [islandSetId, setIslandSetId] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [closePhase, setClosePhase] = useState<ClosePhase>('idle')
  const closeHandlerRef = useRef<(() => void) | null>(null)
  const globalMouseRef = useRef({ x: 0, y: 0, has: false })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      globalMouseRef.current = { x: e.clientX, y: e.clientY, has: true }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    // Also capture clicks to ensure we have the latest position even if move didn't fire
    window.addEventListener('pointerdown', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
    }
  }, [])

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
        globalMouseRef,
      }}
    >
      {children}
    </GalleryContext.Provider>
  )
}
