import { useLayoutEffect, useMemo } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/all'
import { useNavigate, useParams } from 'react-router-dom'
import { getPhotoSet } from '../data/photoSets'
import { useFlipBridge } from '../flip/flipBridge'

export default function SetPage() {
  const { id } = useParams<{ id: string }>()
  const set = useMemo(() => (id ? getPhotoSet(id) : undefined), [id])
  const navigate = useNavigate()
  const { consumePendingFlip, setPendingFlip } = useFlipBridge()

  useLayoutEffect(() => {
    gsap.registerPlugin(Flip)
    const pending = consumePendingFlip()
    if (!pending) return

    requestAnimationFrame(() => {
      Flip.from(pending.state, {
        duration: 0.75,
        ease: 'power2.inOut',
        absolute: true,
        scale: true,
      })
    })
  }, [consumePendingFlip])

  if (!set) {
    return (
      <section className="set-page">
        <div className="set-header">
          <h2 className="set-title">Not found</h2>
          <button className="ghost" type="button" onClick={() => navigate('/')}>
            Back
          </button>
        </div>
      </section>
    )
  }

  const flipId = `set-preview-${set.id}`

  const onBack = () => {
    const node = document.querySelector(`[data-flip-id="${flipId}"]`) as HTMLElement | null
    if (node) {
      const state = Flip.getState(node)
      setPendingFlip({ state, flipId })
    } else {
      setPendingFlip(null)
    }
    navigate('/')
  }

  return (
    <section className="set-page">
      <div className="set-header">
        <div className="dynamic-island">
          <button className="island-close-btn" type="button" onClick={onBack} aria-label="Close">
            ✕
          </button>
          <div className="island-preview" data-flip-id={flipId}>
            <img src={set.photos[0]?.src} alt="" />
          </div>
          <h2 className="island-title">{set.name}</h2>
        </div>
      </div>

      <div className="set-grid" role="list">
        {set.photos.slice(1).map((photo) => (
          <div key={photo.id} className="set-grid-item" role="listitem">
            <img src={photo.src} alt={photo.alt} loading="lazy" />
          </div>
        ))}
      </div>
    </section>
  )
}
