import { useLayoutEffect, useMemo, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/all'
import { useNavigate, useParams } from 'react-router-dom'
import { getPhotoSet } from '../data/photoSets'
import { useFlipBridge } from '../flip/flipBridge'
import { useGallery } from '../context/useGallery'

export default function SetPage() {
  const { id } = useParams<{ id: string }>()
  const set = useMemo(() => (id ? getPhotoSet(id) : undefined), [id])
  const navigate = useNavigate()
  const { consumePendingFlip, setPendingFlip } = useFlipBridge()
  const { setActiveSetId, registerCloseHandler } = useGallery()

  useEffect(() => {
    if (id) setActiveSetId(id)
    return () => setActiveSetId(null)
  }, [id, setActiveSetId])

  useLayoutEffect(() => {
    gsap.registerPlugin(Flip)
    const pending = consumePendingFlip()
    if (!pending) return

    // We need to target the image in DynamicIsland?
    // Or just let DynamicIsland handle it?
    // If we have pending flip state, we want to animate FROM it TO the DynamicIsland image.
    // But DynamicIsland is in AppShell.
    // We can find it by ID.
    
    const destImg = document.querySelector('#dynamic-island-hero-slot img')
    if (destImg) {
        requestAnimationFrame(() => {
            Flip.from(pending.state, {
                targets: destImg,
                duration: 0.75,
                ease: 'power2.inOut',
                absolute: true,
                scale: true,
                props: 'boxShadow',
            })
        })
    }
  }, [consumePendingFlip])

  const onBack = useCallback(() => {
    const flipId = `set-preview-${set?.id}`
    // We want to capture state of DynamicIsland image?
    const node = document.querySelector('#dynamic-island-hero-slot img') as HTMLElement | null
    if (node) {
      const state = Flip.getState(node, { props: 'boxShadow' })
      setPendingFlip({ state, flipId })
    } else {
      setPendingFlip(null)
    }
    navigate('/')
  }, [navigate, set?.id, setPendingFlip])

    useEffect(() => {
      registerCloseHandler(onBack)
    }, [registerCloseHandler, onBack])

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

  return (
    <section className="set-page">
      <div className="set-header" style={{ minHeight: '80px' }} />

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
