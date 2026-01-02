import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { useGallery } from '../context/useGallery'
import { getPhotoSet } from '../data/photoSets'

export default function DynamicIsland() {
  const { islandSetId, setIslandSetId, isTransitioning, closePhase, requestClose } = useGallery()
  const containerRef = useRef<HTMLDivElement>(null)
  const homeContentRef = useRef<HTMLDivElement>(null)
  const setContentRef = useRef<HTMLDivElement>(null)
  const prevRectRef = useRef<{ width: number; height: number } | null>(null)

  // We need to know the previous ID to know direction
  const prevIdRef = useRef<string | null>(null)

  const closeRequestedRef = useRef(false)
  const homeEnterRequestedRef = useRef(false)

  useEffect(() => {
    if (!islandSetId && closePhase === 'idle') {
      closeRequestedRef.current = false
    }
  }, [islandSetId, closePhase])

  useLayoutEffect(() => {
    if (islandSetId) return
    if (!homeEnterRequestedRef.current) return

    const el = homeContentRef.current
    if (!el) return

    gsap.killTweensOf(el)
    gsap.fromTo(
      el,
      { opacity: 0, y: 10, filter: 'blur(10px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.48,
        ease: 'power3.out',
        overwrite: 'auto',
      },
    )

    homeEnterRequestedRef.current = false
  }, [islandSetId])

  const activeSet = useMemo(() => (islandSetId ? getPhotoSet(islandSetId) : null), [islandSetId])

  const startClose = useCallback(() => {
    closeRequestedRef.current = true
    requestClose()
  }, [requestClose])

  // When exiting: wait for the set grid to transition out (HomePage emits that via closePhase),
  // then start the Dynamic Island exit. The hero FLIP begins first; then we fade the button/title.
  useLayoutEffect(() => {
    if (!closeRequestedRef.current) return
    if (closePhase !== 'hero-exit') return

    const setContent = setContentRef.current
    if (!setContent) return

    const closeBtn = setContent.querySelector<HTMLElement>('.island-close-btn')
    const preview = setContent.querySelector<HTMLElement>('.island-preview-wrapper')
    const title = setContent.querySelector<HTMLElement>('.island-title')

    // Hero starts moving via the FLIP proxy; avoid showing an empty preview frame.
    const heroFirstTargets = [preview].filter(Boolean) as HTMLElement[]
    const textTargets = [closeBtn, title].filter(Boolean) as HTMLElement[]

    const textExitAt = 0.5
    const textExitTotal = 0.22 + 0.03
    const homeEnterAt = textExitAt + textExitTotal

    gsap.killTweensOf([...heroFirstTargets, ...textTargets])

    gsap
      .timeline()
      .to(heroFirstTargets, {
        opacity: 0,
        duration: 0.18,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      .to(
        textTargets,
        {
          opacity: 0,
          y: -8,
          filter: 'blur(8px)',
          duration: 0.22,
          ease: 'power2.in',
          stagger: 0.03,
          overwrite: 'auto',
        },
        textExitAt,
      )
      // Once the set UI is animated out, switch the island back to home content
      // and let the home title animate in.
      .call(
        () => {
          homeEnterRequestedRef.current = true
          setIslandSetId(null)
        },
        [],
        homeEnterAt,
      )
  }, [closePhase, setIslandSetId])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const isOpening = !prevIdRef.current && islandSetId

    // Smoothly animate the container size instead of snapping.
    const nextRect = container.getBoundingClientRect()
    const prevRect = prevRectRef.current
    prevRectRef.current = { width: nextRect.width, height: nextRect.height }

    if (prevRect) {
      const widthChanged = Math.abs(prevRect.width - nextRect.width) > 0.5
      const heightChanged = Math.abs(prevRect.height - nextRect.height) > 0.5
      if (widthChanged || heightChanged) {
        gsap.killTweensOf(container)
        gsap.fromTo(
          container,
          { width: prevRect.width, height: prevRect.height },
          {
            width: nextRect.width,
            height: nextRect.height,
            duration: 0.55,
            ease: 'power3.inOut',
            clearProps: 'width,height',
            overwrite: 'auto',
          },
        )
      }
    }

    // Better text entrance animations.
    if (isOpening) {
      const setContent = setContentRef.current
      if (setContent) {
        const closeBtn = setContent.querySelector<HTMLElement>('.island-close-btn')
        const preview = setContent.querySelector<HTMLElement>('.island-preview-wrapper')
        const title = setContent.querySelector<HTMLElement>('.island-title')
        // During the click-into FLIP, the hero image is animated via a proxy element.
        // Fading the preview wrapper here can make the hero briefly disappear (blink).
        const targets = (isTransitioning ? [closeBtn, title] : [closeBtn, preview, title]).filter(
          Boolean,
        ) as HTMLElement[]

        if (isTransitioning && preview) {
          gsap.killTweensOf(preview)
          gsap.set(preview, { opacity: 1, y: 0, filter: 'blur(0px)', overwrite: 'auto' })
        }

        gsap.killTweensOf(targets)
        gsap.fromTo(
          targets,
          { opacity: 0, y: 10, filter: 'blur(10px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.48,
            ease: 'power3.out',
            stagger: 0.04,
            delay: 0.08,
            overwrite: 'auto',
          },
        )
      }
    }

    prevIdRef.current = islandSetId
  }, [islandSetId, isTransitioning])

  return (
    <div 
      ref={containerRef} 
      className={`dynamic-island ${islandSetId ? 'dynamic-island--set' : 'dynamic-island--home'}`}
    >
      {/* Home Content */}
      {!islandSetId && (
          <div ref={homeContentRef} className="brand" style={{ textAlign: 'center' }}>
            komplete.chaos
          </div>
      )}

      {/* Set Content */}
      {islandSetId && (
        <div
          ref={setContentRef}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <button
            className="island-close-btn"
            type="button"
            onClick={startClose}
            aria-label="Close"
          >
            ✕
          </button>
          <div className="island-preview-wrapper">
            <div id="dynamic-island-hero-slot" className="set-hero-slot">
              {activeSet && (
                <img
                  src={activeSet.photos[0].src}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
                />
              )}
            </div>
          </div>
          <h2 className="island-title">{activeSet?.name}</h2>
        </div>
      )}
    </div>
  )
}
