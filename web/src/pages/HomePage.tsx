import { useLayoutEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { Flip, ScrollTrigger } from 'gsap/all'
import { useNavigate } from 'react-router-dom'
import { getSetPreviewPhoto, photoSets } from '../data/photoSets'
import { useFlipBridge } from '../flip/flipBridge'

export default function HomePage() {
  const sets = useMemo(() => photoSets, [])

  const rootRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  const navigate = useNavigate()
  const { setPendingFlip } = useFlipBridge()

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

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
  }, [])

  const openSet = (setId: string) => {
    const flipId = `set-preview-${setId}`
    const node = document.querySelector(`[data-flip-id="${flipId}"]`) as HTMLElement | null
    if (node) {
      gsap.registerPlugin(Flip)
      const state = Flip.getState(node)
      setPendingFlip({ state, flipId })
    } else {
      setPendingFlip(null)
    }

    navigate(`/set/${setId}`)
  }

  return (
    <section className="landing">
      <div className="hscroll" ref={rootRef}>
        <div className="hscroll-track" ref={trackRef}>
          {sets.map((set) => {
            const preview = getSetPreviewPhoto(set)
            const flipId = `set-preview-${set.id}`

            return (
              <article
                key={set.id}
                className="hscroll-item"
              >
                <button
                  className="hscroll-preview"
                  type="button"
                  onClick={() => openSet(set.id)}
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
  )
}
