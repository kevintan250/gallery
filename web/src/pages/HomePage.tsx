import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { gsap } from 'gsap'
import { Flip, ScrollTrigger } from 'gsap/all'
import { getPhotoSet, getSetPreviewPhoto, photoSets } from '../data/photoSets'

export default function HomePage() {
  const sets = useMemo(() => photoSets, [])
  const [activeSetId, setActiveSetId] = useState<string | null>(null)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const setViewRef = useRef<HTMLElement | null>(null)
  const setHeroSlotRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const isTransitioningRef = useRef(false)
  const movingPreviewElRef = useRef<HTMLDivElement | null>(null)

  const activeSet = useMemo(() => {
    if (!activeSetId) return null
    return getPhotoSet(activeSetId) ?? null
  }, [activeSetId])

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (activeSetId) return

    const root = rootRef.current
    const track = trackRef.current
    if (!root || !track) return

    const ctx = gsap.context(() => {
      let tween: gsap.core.Tween | null = null

      const build = () => {
        tween?.scrollTrigger?.kill()
        tween?.kill()

        const header = document.querySelector('.topbar') as HTMLElement | null
        const headerHeight = header?.getBoundingClientRect().height ?? 0
        const totalScroll = track.scrollWidth - root.clientWidth
        if (totalScroll <= 0) return

        tween = gsap.to(track, {
          x: -totalScroll,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: `top top+=${headerHeight}`,
            end: `+=${totalScroll}`,
            scrub: true,
            pin: true,
            anticipatePin: 1,
          },
        })
      }

      build()
      const onResize = () => {
        build()
        ScrollTrigger.refresh()
      }
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
        tween?.scrollTrigger?.kill()
        tween?.kill()
      }
    }, root)

    return () => ctx.revert()
  }, [activeSetId])

  useLayoutEffect(() => {
    if (activeSetId) return

    const scope = rootRef.current
    if (!scope) return

    const ctx = gsap.context(() => {
      gsap.set('.hscroll-item', { clearProps: 'transform,opacity' })
      gsap.set('.hscroll-preview', { clearProps: 'transform' })
    }, scope)

    return () => ctx.revert()
  }, [activeSetId])

  const openSetInPlace = (setId: string, clickedButton: HTMLButtonElement) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true

    gsap.registerPlugin(Flip)
    const set = getPhotoSet(setId)
    if (!set) {
      isTransitioningRef.current = false
      return
    }

    const preview = getSetPreviewPhoto(set)
    const clickedRect = clickedButton.getBoundingClientRect()

    // Ensure a single moving element (like the reference demo: move the same element between containers).
    if (!movingPreviewElRef.current) {
      const el = document.createElement('div')
      el.className = 'moving-preview'
      const img = document.createElement('img')
      el.appendChild(img)
      movingPreviewElRef.current = el
    }

    const overlay = overlayRef.current
    const movingEl = movingPreviewElRef.current
    if (!overlay || !movingEl) {
      isTransitioningRef.current = false
      return
    }

    const img = movingEl.querySelector('img')
    if (img) {
      img.src = preview.src
      img.alt = preview.alt
    }

    overlay.appendChild(movingEl)
    movingEl.style.position = 'absolute'
    movingEl.style.left = `${clickedRect.left}px`
    movingEl.style.top = `${clickedRect.top}px`
    movingEl.style.width = `${clickedRect.width}px`
    movingEl.style.height = `${clickedRect.height}px`

    const root = rootRef.current
    const track = trackRef.current
    const clickedItem = clickedButton.closest('.hscroll-item') as HTMLElement | null

    const rootRect = root?.getBoundingClientRect()
    const offscreen = (rootRect?.width ?? window.innerWidth) + 80

    const leftSide: HTMLElement[] = []
    const rightSide: HTMLElement[] = []

    if (root && track && clickedItem && rootRect) {
      const clickedRect = clickedItem.getBoundingClientRect()
      const clickedCenterX = clickedRect.left + clickedRect.width / 2

      const items = Array.from(track.querySelectorAll<HTMLElement>('.hscroll-item'))
      const visibleItems = items.filter((item) => {
        const rect = item.getBoundingClientRect()
        return rect.right > rootRect.left && rect.left < rootRect.right
      })

      for (const item of visibleItems) {
        if (item === clickedItem) continue
        const rect = item.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        if (centerX < clickedCenterX) leftSide.push(item)
        else rightSide.push(item)
      }
    }

    const tl = gsap.timeline({
      onComplete: () => {
        if (root) gsap.set(root, { pointerEvents: '' })

        flushSync(() => setActiveSetId(setId))

        const slot = setHeroSlotRef.current
        const setScope = setViewRef.current
        const movingEl = movingPreviewElRef.current
        if (!slot || !setScope || !movingEl) {
          isTransitioningRef.current = false
          return
        }

        // Grab the starting state, then reparent into the final container and FLIP.
        const state = Flip.getState(movingEl)
        slot.appendChild(movingEl)
        movingEl.style.cssText = ''

        const transition = Flip.from(state, {
          scale: true,
          absolute: true,
          duration: 0.9,
          ease: 'power3.inOut',
          paused: true,
        })
          .progress(1)
          .progress(0)

        transition.play(0)

        const headerBits = setScope.querySelectorAll<HTMLElement>('[data-set-anim="header"]')
        const gridItems = Array.from(setScope.querySelectorAll<HTMLElement>('[data-set-anim="grid"]'))

        if (headerBits.length) {
          gsap.from(headerBits, {
            x: -28,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.04,
            delay: 0.08,
          })
        }

        if (gridItems.length) {
          gsap.set(gridItems, { opacity: 0 })

          const count = gridItems.length
          const maxDim = gridItems.reduce((acc, el) => {
            const r = el.getBoundingClientRect()
            return Math.max(acc, r.width, r.height)
          }, 0)
          const radius = Math.hypot(window.innerWidth, window.innerHeight) / 2 + maxDim / 2 + 120

          gsap.from(gridItems, {
            x: (index: number) => {
              const angle = (index / count) * Math.PI * 2
              return Math.cos(angle) * radius
            },
            y: (index: number) => {
              const angle = (index / count) * Math.PI * 2
              return Math.sin(angle) * radius
            },
            opacity: 0,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.03,
            delay: 0.12,
          })
        }

        isTransitioningRef.current = false
      },
      onInterrupt: () => {
        if (root) gsap.set(root, { pointerEvents: '' })
        isTransitioningRef.current = false
      },
    })

    if (root) gsap.set(root, { pointerEvents: 'none' })
    if (clickedItem) gsap.set(clickedItem, { zIndex: 2 })

    // Subtle “lock-in” on the clicked preview.
    tl.to(
      clickedButton,
      { scale: 0.985, duration: 0.08, ease: 'power2.out', transformOrigin: 'center center' },
      0,
    ).to(
      clickedButton,
      { scale: 1, duration: 0.22, ease: 'power2.out', transformOrigin: 'center center' },
      0.08,
    )

    // Neighbors ease offscreen while the clicked preview stays.
    const duration = 0.55
    const ease = 'power3.inOut'

    if (leftSide.length) {
      tl.to(
        leftSide,
        {
          duration,
          ease,
          x: (_: number, target: Element) => {
            const w = (target as HTMLElement).getBoundingClientRect().width
            return -(offscreen + w)
          },
          opacity: 0,
        },
        0,
      )
    }

    if (rightSide.length) {
      tl.to(
        rightSide,
        {
          duration,
          ease,
          x: (_: number, target: Element) => {
            const w = (target as HTMLElement).getBoundingClientRect().width
            return offscreen + w
          },
          opacity: 0,
        },
        0,
      )
    }

    // If we couldn't find neighbors (or refs), still hold until lock-in completes.
    tl.to({}, { duration: Math.max(0, duration - 0.22) }, 0.22)
  }

  const closeSet = () => {
    const movingEl = movingPreviewElRef.current
    if (movingEl?.parentElement) {
      movingEl.parentElement.removeChild(movingEl)
    }
    setActiveSetId(null)
  }

  return (
    <>
      <div className="flip-overlay" ref={overlayRef} aria-hidden="true" />

      {activeSetId ? (
        activeSet ? (
          <section className="set-page" ref={setViewRef}>
            <div className="set-header">
              <div className="set-header-left" data-set-anim="header">
                <div className="set-hero">
                  <div className="set-hero-slot" ref={setHeroSlotRef} />
                </div>

                <div>
                  <h2 className="set-title" data-set-anim="header">
                    {activeSet.name}
                  </h2>
                  <div className="set-subtitle" data-set-anim="header">
                    {activeSet.location}
                  </div>
                </div>
              </div>

              <button className="ghost" type="button" onClick={closeSet} data-set-anim="header">
                Back to sets
              </button>
            </div>

            <div className="set-grid" role="list">
              {activeSet.photos.slice(1).map((photo) => (
                <div key={photo.id} className="set-grid-item" role="listitem" data-set-anim="grid">
                  <img src={photo.src} alt={photo.alt} loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="set-page">
            <div className="set-header">
              <h2 className="set-title">Not found</h2>
              <button className="ghost" type="button" onClick={closeSet}>
                Back to sets
              </button>
            </div>
          </section>
        )
      ) : (
        <section className="landing">
          <div className="hscroll" ref={rootRef}>
            <div className="hscroll-track" ref={trackRef}>
              {sets.map((set) => {
                const preview = getSetPreviewPhoto(set)
                const flipId = `set-preview-${set.id}`

                return (
                  <article key={set.id} className="hscroll-item">
                    <button
                      className="hscroll-preview"
                      type="button"
                      onClick={(e) => openSetInPlace(set.id, e.currentTarget)}
                      aria-label={`Open ${set.name}`}
                    >
                      <div className="flip-target" data-flip-id={flipId}>
                        <img src={preview.src} alt={preview.alt} />
                      </div>
                    </button>

                    <div className="hscroll-meta">
                      <div className="hscroll-title">{set.name}</div>
                      <div className="hscroll-subtitle">{set.location}</div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
