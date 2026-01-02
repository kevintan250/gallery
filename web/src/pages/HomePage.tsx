import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { gsap } from 'gsap'
import { Draggable, Flip, Observer } from 'gsap/all'
import { getPhotoSet, getSetPreviewPhoto, photoSets } from '../data/photoSets'
import { useGallery } from '../context/useGallery'

export default function HomePage() {
  const {
    activeSetId,
    setActiveSetId,
    setIsTransitioning,
    setClosePhase,
    registerCloseHandler,
  } = useGallery()
  const sets = useMemo(() => photoSets, [])
  const [hoverLabelContent, setHoverLabelContent] = useState<{ title: string; subtitle: string }>(
    { title: '', subtitle: '' },
  )
  const [hoverLabelVisible, setHoverLabelVisible] = useState(false)
  const hoverLabelVisibleRef = useRef(false)

  const currentCarouselIndexRef = useRef(0)
  const inactivePreviewScale = 0.8
  const basePreviewImgScale = 1.1

  const rootRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const setViewRef = useRef<HTMLElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const isTransitioningRef = useRef(false)
  const parallaxEnabledRef = useRef(true)
  const parallaxKickRef = useRef<(() => void) | null>(null)
  const goToIndexRef = useRef<((nextIndex: number) => void) | null>(null)
  const hoverLabelRef = useRef<HTMLDivElement | null>(null)
  const movingPreviewElRef = useRef<HTMLDivElement | null>(null)
  const lastScrollPos = useRef(0)
  const closingSetIdRef = useRef<string | null>(null)
  const hideAnimationRef = useRef<gsap.core.Tween | null>(null)

  type PreviewParallaxFns = {
    outerRX: (value: number) => void
    outerRY: (value: number) => void
    scaleTo: (value: number) => void
    zTo: (value: number) => void
    innerScale: ((value: number) => void) | null
  }

  // Keep a stable registry of the per-preview quickTo setters.
  // IMPORTANT: using gsap.to(... overwrite:'auto') on the same properties can kill
  // these tweens, leaving the returned functions “dead” and causing the parallax to freeze.
  const previewParallaxRef = useRef<Map<HTMLElement, PreviewParallaxFns>>(new Map())

  const activeSet = useMemo(() => {
    if (!activeSetId) return null
    return getPhotoSet(activeSetId) ?? null
  }, [activeSetId])

  const gridTransforms = useMemo(() => {
    if (!activeSet) return []
    return activeSet.photos.slice(1).map((photo) => ({
      rotation: photo.rotation ?? 0,
      scale: photo.scale ?? 1,
      x: photo.x ?? 0,
      y: photo.y ?? 0,
      width: photo.width,
      height: photo.height,
    }))
  }, [activeSet])

  useEffect(() => {
    hoverLabelVisibleRef.current = hoverLabelVisible
  }, [hoverLabelVisible])

  const setGalleryInteractive = useCallback((enabled: boolean) => {
    const root = rootRef.current
    if (!root) return
    root.dataset.galleryInteractive = enabled ? 'true' : 'false'
  }, [])

  const disablePreviewParallax = useCallback(() => {
    parallaxEnabledRef.current = false
    setGalleryInteractive(false)
  }, [setGalleryInteractive])

  const enablePreviewParallax = useCallback(() => {
    parallaxEnabledRef.current = true
    setGalleryInteractive(true)
    parallaxKickRef.current?.()
  }, [setGalleryInteractive])

  useLayoutEffect(() => {
    gsap.registerPlugin(Observer)

    if (activeSetId) return

    const root = rootRef.current
    const track = trackRef.current
    if (!root || !track) return

    const ctx = gsap.context(() => {
      let animating = false
      let observer: Observer | null = null

      const viewport = root.querySelector<HTMLElement>('.hscroll')
      if (!viewport) return

      const getItems = () => Array.from(track.querySelectorAll<HTMLElement>('.hscroll-item'))

      const settlePreviewParallax = () => {
        const previews = Array.from(track.querySelectorAll<HTMLElement>('.hscroll-preview'))
        for (const preview of previews) {
          const fns = previewParallaxRef.current.get(preview)
          if (fns) {
            fns.outerRX(0)
            fns.outerRY(0)
            fns.zTo(0)
            fns.innerScale?.(basePreviewImgScale)
            continue
          }

          // Fallback (should be rare): if the registry isn't ready yet, do a direct tween.
          const target = preview.querySelector<HTMLElement>('.flip-target')
          const img = preview.querySelector<HTMLImageElement>('.flip-target img')
          if (target) {
            gsap.to(target, {
              rotationX: 0,
              rotationY: 0,
              z: 0,
              duration: 0.18,
              ease: 'power2.out',
            })
          }
          if (img) {
            gsap.to(img, {
              scale: basePreviewImgScale,
              duration: 0.18,
              ease: 'power2.out',
            })
          }
        }
      }

      const applyPreviewScales = (activeIndex: number) => {
        const items = getItems()
        for (let i = 0; i < items.length; i++) {
          const flipTarget = items[i].querySelector<HTMLElement>('.hscroll-preview .flip-target')
          if (!flipTarget) continue
          const targetScale = i === activeIndex ? 1 : inactivePreviewScale
          gsap.set(flipTarget, { scale: targetScale, transformOrigin: 'center center' })
        }
      }

      const computeTrackXForIndex = (index: number) => {
        const items = getItems()
        if (items.length === 0) return 0
        const safeIndex = Math.max(0, Math.min(items.length - 1, index))
        const item = items[safeIndex]

        const viewportCenter = viewport.clientWidth / 2
        const itemCenter = item.offsetLeft + item.offsetWidth / 2
        return -(itemCenter - viewportCenter)
      }

      const goTo = (nextIndex: number) => {
        if (animating) return
        if (isTransitioningRef.current) return

        const items = getItems()
        if (items.length === 0) return

        const clamped = Math.max(0, Math.min(items.length - 1, nextIndex))
        const prevIndex = currentCarouselIndexRef.current
        if (clamped === prevIndex) return

        animating = true

        // Ensure any hover/parallax state resolves even if the mouse doesn't move.
        disablePreviewParallax()
        settlePreviewParallax()

        const next = clamped
        const moveDuration = 0.85
        const moveEase = 'power2.inOut'

        // Keep everything at the inactive scale except the current (prev) which is full size.
        // We'll animate prev down and next up over the exact same duration as the slide.
        for (let i = 0; i < items.length; i++) {
          const flipTarget = items[i].querySelector<HTMLElement>('.hscroll-preview .flip-target')
          if (!flipTarget) continue
          if (i === prevIndex) continue
          gsap.set(flipTarget, { scale: inactivePreviewScale, transformOrigin: 'center center' })
        }

        const prevFlipTarget = items[prevIndex]?.querySelector<HTMLElement>('.hscroll-preview .flip-target')
        const nextFlipTarget = items[next]?.querySelector<HTMLElement>('.hscroll-preview .flip-target')

        // Ensure known start scales.
        if (prevFlipTarget) gsap.set(prevFlipTarget, { scale: 1, transformOrigin: 'center center' })
        if (nextFlipTarget) gsap.set(nextFlipTarget, { scale: inactivePreviewScale, transformOrigin: 'center center' })

        gsap
          .timeline({
            defaults: { duration: moveDuration, ease: moveEase, overwrite: 'auto' },
            onComplete: () => {
              currentCarouselIndexRef.current = next
              applyPreviewScales(next)
              animating = false
              enablePreviewParallax()
            },
            onInterrupt: () => {
              // If the tween gets killed/overwritten (rare, but can happen during rapid state changes),
              // don't leave the gallery in a permanently non-interactive state.
              applyPreviewScales(currentCarouselIndexRef.current)
              animating = false
              enablePreviewParallax()
            },
          })
          .to(track, { x: computeTrackXForIndex(next) }, 0)
            .to(prevFlipTarget, { scale: inactivePreviewScale }, 0)
          .to(nextFlipTarget, { scale: 1 }, 0)
      }

      const refresh = () => {
        gsap.set(track, { x: computeTrackXForIndex(currentCarouselIndexRef.current) })
        applyPreviewScales(currentCarouselIndexRef.current)
      }

      refresh()

      // Expose for click-to-center behavior.
      goToIndexRef.current = goTo

      // Default: allow hover interactions in the gallery view.
      setGalleryInteractive(parallaxEnabledRef.current)

      // If images load after initial layout, scrollWidth can change — refresh measurements.
      const imgs = Array.from(track.querySelectorAll('img'))
      const onImgLoad = () => {
        refresh()
      }
      for (const img of imgs) {
        if (!img.complete) {
          img.addEventListener('load', onImgLoad)
          img.addEventListener('error', onImgLoad)
        }
      }

      if (lastScrollPos.current > 0) {
        const savedPos = lastScrollPos.current
        window.scrollTo(0, savedPos)
        lastScrollPos.current = 0
      }

      observer = Observer.create({
        target: root,
        type: 'wheel,touch',
        wheelSpeed: -1,
        tolerance: 12,
        preventDefault: true,
        // Allow trackpads/mice to scroll horizontally as well.
        lockAxis: true,
        onDown: () => {
          if (animating) return
          goTo(currentCarouselIndexRef.current - 1)
        },
        onUp: () => {
          if (animating) return
          goTo(currentCarouselIndexRef.current + 1)
        },
        onLeft: () => {
          if (animating) return
          goTo(currentCarouselIndexRef.current + 1)
        },
        onRight: () => {
          if (animating) return
          goTo(currentCarouselIndexRef.current - 1)
        },
      })

      // Snap to the last-known centered index (e.g. when returning from a set view).
      const items = getItems()
      const startIndex = Math.max(0, Math.min(items.length - 1, currentCarouselIndexRef.current))
      gsap.set(track, { x: computeTrackXForIndex(startIndex) })
      currentCarouselIndexRef.current = startIndex
      applyPreviewScales(startIndex)

      const onResize = () => {
        refresh()
      }
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
        observer?.kill()
        observer = null
        parallaxKickRef.current = null
        if (goToIndexRef.current === goTo) goToIndexRef.current = null
        for (const img of imgs) {
          img.removeEventListener('load', onImgLoad)
          img.removeEventListener('error', onImgLoad)
        }
      }
    }, root)

    return () => ctx.revert()
  }, [activeSetId, disablePreviewParallax, enablePreviewParallax, setGalleryInteractive])

  useLayoutEffect(() => {
    if (activeSetId) return

    const scope = rootRef.current
    if (!scope) return

    const ctx = gsap.context(() => {
      gsap.set('.hscroll-item', { clearProps: 'transform,opacity' })
      gsap.set('.hscroll-preview', { clearProps: 'transform' })

      const lastMouse = { x: 0, y: 0, has: false }

      const labelEl = hoverLabelRef.current
      const labelOffsetY = 16

      const xSet = labelEl ? gsap.quickSetter(labelEl, 'x', 'px') : null
      const ySet = labelEl ? gsap.quickSetter(labelEl, 'y', 'px') : null

      const updateLabelPosition = () => {
        if (!labelEl) return
        if (!lastMouse.has) return
        xSet?.(lastMouse.x)
        // Position label with top left corner near the cursor.
        ySet?.(lastMouse.y + labelOffsetY)
      }

      const getMetaFromPreview = (previewEl: HTMLElement) => {
        const item = previewEl.closest('.hscroll-item') as HTMLElement | null
        const title = item?.dataset?.setName ?? ''
        const subtitle = item?.dataset?.setLocation ?? ''
        return { title, subtitle }
      }

      const showHoverLabelForPreview = (previewEl: HTMLElement) => {
        const { title, subtitle } = getMetaFromPreview(previewEl)
        setHoverLabelContent({ title, subtitle })
        setHoverLabelVisible(true)
        updateLabelPosition()
      }

      const hideHoverLabel = () => {
        const el = hoverLabelRef.current
        if (!el) return
        
        // Kill any existing hide animation
        if (hideAnimationRef.current) {
          hideAnimationRef.current.kill()
        }
        
        // Animate out, then change state
        hideAnimationRef.current = gsap.to(el, {
          autoAlpha: 0,
          scale: 0.5,
          duration: 0.25,
          ease: 'back.in(1.7)',
          onComplete: () => {
            setHoverLabelVisible(false)
            hideAnimationRef.current = null
          },
        })
      }

      const onPointerMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        lastMouse.x = e.clientX
        lastMouse.y = e.clientY
        lastMouse.has = true
        updateLabelPosition()
      }

      // Track mouse position globally so the label always follows while visible.
      window.addEventListener('pointermove', onPointerMove, { passive: true })

      const kickParallaxUnderCursor = () => {
        if (!lastMouse.has) return
        if (!parallaxEnabledRef.current) return
        if (isTransitioningRef.current) return

        const el = document.elementFromPoint(lastMouse.x, lastMouse.y)
        if (!el) return

        const preview = (el as HTMLElement).closest?.('.hscroll-preview') as HTMLElement | null
        if (!preview) return

        // If a preview slides under the cursor (e.g. after scroll), show the hover label without requiring mouse movement.
        showHoverLabelForPreview(preview)

        const target = preview.querySelector<HTMLElement>('.flip-target')
        if (!target) return

        const r = target.getBoundingClientRect()
        if (r.width <= 0 || r.height <= 0) return

        const px = (lastMouse.x - r.left) / r.width
        const py = (lastMouse.y - r.top) / r.height
        const clampedX = Math.max(0, Math.min(1, px))
        const clampedY = Math.max(0, Math.min(1, py))

        const maxTilt = 6
        const hoverZ = 22
        const hoverImgScale = basePreviewImgScale

        const fns = previewParallaxRef.current.get(preview)
        if (fns) {
          fns.zTo(hoverZ)
          fns.innerScale?.(hoverImgScale)
          fns.outerRX(gsap.utils.interpolate(-maxTilt, maxTilt, clampedY))
          fns.outerRY(gsap.utils.interpolate(maxTilt, -maxTilt, clampedX))
          return
        }

        // Fallback (should be rare): if the registry isn't ready yet, do a direct tween.
        const img = preview.querySelector<HTMLImageElement>('.flip-target img')
        gsap.to(target, {
          rotationX: gsap.utils.interpolate(-maxTilt, maxTilt, clampedY),
          rotationY: gsap.utils.interpolate(maxTilt, -maxTilt, clampedX),
          z: hoverZ,
          duration: 0.25,
          ease: 'power3.out',
        })
        if (img) {
          gsap.to(img, {
            scale: hoverImgScale,
            duration: 0.25,
            ease: 'power3.out',
          })
        }
      }

      parallaxKickRef.current = kickParallaxUnderCursor

      if (labelEl) {
        gsap.set(labelEl, {
          x: 0,
          y: 0,
          autoAlpha: 0,
          willChange: 'transform,opacity',
        })
      }

      const previews = Array.from(scope.querySelectorAll<HTMLElement>('.hscroll-preview'))
      const cleanups: Array<() => void> = []

      for (let previewIndex = 0; previewIndex < previews.length; previewIndex++) {
        const preview = previews[previewIndex]
        const target = preview.querySelector<HTMLElement>('.flip-target')
        const img = preview.querySelector<HTMLElement>('.flip-target img')
        if (!target) continue

        gsap.set(preview, {
          perspective: 650,
        })

        gsap.set(target, {
          transformOrigin: 'center',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        })

        if (img) {
          gsap.set(img, {
            willChange: 'transform',
            force3D: true,
            transformOrigin: 'center',
            scale: basePreviewImgScale,
          })
        }

        const outerRX = gsap.quickTo(target, 'rotationX', { duration: 0.25, ease: 'power3.out' })
        const outerRY = gsap.quickTo(target, 'rotationY', { duration: 0.25, ease: 'power3.out' })
        const scaleTo = gsap.quickTo(target, 'scale', { duration: 0.25, ease: 'power3.out' })
        const zTo = gsap.quickTo(target, 'z', { duration: 0.25, ease: 'power3.out' })
        const innerScale = img ? gsap.quickTo(img, 'scale', { duration: 0.25, ease: 'power3.out' }) : null

        previewParallaxRef.current.set(preview, { outerRX, outerRY, scaleTo, zTo, innerScale })

        const maxTilt = 6
        const hoverZ = 22
        const hoverImgScale = basePreviewImgScale

        const onEnter = (e: PointerEvent) => {
          if (e.pointerType === 'touch') return
          if (!parallaxEnabledRef.current) return
          if (isTransitioningRef.current) return
          // Ensure label/parallax can start even if the cursor was stationary.
          if (e.pointerType === 'mouse') {
            lastMouse.x = e.clientX
            lastMouse.y = e.clientY
            lastMouse.has = true
          }
          showHoverLabelForPreview(preview)
          updateLabelPosition()
          zTo(hoverZ)
          innerScale?.(hoverImgScale)
          onMove(e)
        }

        const onMove = (e: PointerEvent) => {
          if (e.pointerType === 'touch') return
          if (!parallaxEnabledRef.current) return
          if (isTransitioningRef.current) return
          const r = target.getBoundingClientRect()
          if (r.width <= 0 || r.height <= 0) return

          const px = (e.clientX - r.left) / r.width
          const py = (e.clientY - r.top) / r.height
          const clampedX = Math.max(0, Math.min(1, px))
          const clampedY = Math.max(0, Math.min(1, py))

          // Tilt so the hovered edge lifts TOWARD the cursor (toward viewer), not away.
          // CSS note: with Y+ downward, negative rotationX brings the top edge closer.
          outerRX(gsap.utils.interpolate(-maxTilt, maxTilt, clampedY))
          outerRY(gsap.utils.interpolate(maxTilt, -maxTilt, clampedX))
        }

        const onLeave = (e: PointerEvent) => {
          if (e.pointerType === 'touch') return
          if (isTransitioningRef.current) return
          hideHoverLabel()
          outerRX(0)
          outerRY(0)
          scaleTo(previewIndex === currentCarouselIndexRef.current ? 1 : inactivePreviewScale)
          zTo(0)
          innerScale?.(basePreviewImgScale)
        }

        preview.addEventListener('pointerenter', onEnter)
        preview.addEventListener('pointermove', onMove)
        preview.addEventListener('pointerleave', onLeave)

        cleanups.push(() => {
          previewParallaxRef.current.delete(preview)
          preview.removeEventListener('pointerenter', onEnter)
          preview.removeEventListener('pointermove', onMove)
          preview.removeEventListener('pointerleave', onLeave)
          gsap.set(target, { rotationX: 0, rotationY: 0, scale: 1, z: 0 })
          if (img) gsap.set(img, { scale: basePreviewImgScale })
        })
      }

      return () => {
        window.removeEventListener('pointermove', onPointerMove)
        if (parallaxKickRef.current === kickParallaxUnderCursor) {
          parallaxKickRef.current = null
        }
        // Ensure label is hidden if we unmount the landing view.
        setHoverLabelVisible(false)
        cleanups.forEach((fn) => fn())
      }
    }, scope)

    return () => ctx.revert()
  }, [activeSetId])

  useLayoutEffect(() => {
    if (!activeSetId) return

    gsap.registerPlugin(Draggable)
    const scope = setViewRef.current
    if (!scope) return

    const ctx = gsap.context(() => {
      let highestZ = 100
      const gridItems = scope.querySelectorAll<HTMLElement>('.set-grid-item')
      gridItems.forEach((item, index) => {
        const originalScale = gridTransforms[index]?.scale ?? 0.8

        // Set initial cursor
        gsap.set(item, { cursor: 'grab' })

        Draggable.create(item, {
          type: 'x,y',
          bounds: window,
          inertia: true,
          onPress: function () {
            highestZ++
            gsap.to(this.target, {
              scale: 1,
              duration: 0.2,
              overwrite: 'auto',
              zIndex: highestZ,
              cursor: 'grabbing',
            })
          },
          onRelease: function () {
            gsap.to(this.target, {
              scale: originalScale,
              duration: 0.2,
              overwrite: 'auto',
              cursor: 'grab',
            })
          },
        })
      })
    }, scope)

    return () => ctx.revert()
  }, [activeSetId, gridTransforms])

  useLayoutEffect(() => {
    const el = hoverLabelRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      if (!hoverLabelVisible || !hoverLabelContent.title) {
        return
      }

      // Cancel any pending hide animation
      if (hideAnimationRef.current) {
        hideAnimationRef.current.kill()
        hideAnimationRef.current = null
      }

      gsap.killTweensOf(el)

      gsap.set(el, { transformOrigin: 'top left' })
      gsap.fromTo(
        el,
        { autoAlpha: 0, scale: 0.5 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.35,
          ease: 'back.out(1.7)',
        },
      )
    }, el)

    return () => ctx.revert()
  }, [hoverLabelVisible, hoverLabelContent.title, hoverLabelContent.subtitle, activeSetId])

  const openSetInPlace = (setId: string, clickedButton: HTMLButtonElement) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true
    setIsTransitioning(true)

    gsap.registerPlugin(Flip)
    const set = getPhotoSet(setId)
    if (!set) {
      isTransitioningRef.current = false
      setIsTransitioning(false)
      return
    }

    const preview = getSetPreviewPhoto(set)
    const clickedTarget = clickedButton.querySelector('.flip-target') as HTMLElement | null
    const clickedImg = clickedTarget?.querySelector('img') as HTMLImageElement | null
    
    // Settle all preview parallax animations (including the clicked one) using quickTo
    const track = trackRef.current
    if (track) {
      const previews = Array.from(track.querySelectorAll<HTMLElement>('.hscroll-preview'))
      for (const preview of previews) {
        const fns = previewParallaxRef.current.get(preview)
        if (fns) {
          fns.outerRX(0)
          fns.outerRY(0)
          fns.zTo(0)
          fns.innerScale?.(basePreviewImgScale)
        }
      }
    }

    // Wait for the settle animation to mostly complete before disabling parallax and starting timeline
    gsap.delayedCall(0.05, () => {
      disablePreviewParallax()
    
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
      // Match the always-zoomed preview images to avoid any perceived shrink/jump
      // when the moving element takes over for the FLIP transition.
      gsap.set(img, { scale: basePreviewImgScale, transformOrigin: 'center center', force3D: true })
    }

    overlay.appendChild(movingEl)
    movingEl.style.position = 'absolute'
    movingEl.style.left = `${clickedRect.left}px`
    movingEl.style.top = `${clickedRect.top}px`
    movingEl.style.width = `${clickedRect.width}px`
    movingEl.style.height = `${clickedRect.height}px`

    const root = rootRef.current
    const clickedItem = clickedButton.closest('.hscroll-item') as HTMLElement | null
    
    // Hide the flip-target (which has the shadow) so only the moving element's shadow is visible
    if (clickedItem) {
      const flipTarget = clickedItem.querySelector('.flip-target') as HTMLElement
      if (flipTarget) gsap.set(flipTarget, { opacity: 0 })
    }

    // Remember which carousel item corresponds to this set so we can restore it on exit.
    if (clickedItem && track) {
      const items = Array.from(track.querySelectorAll<HTMLElement>('.hscroll-item'))
      const idx = items.indexOf(clickedItem)
      if (idx >= 0) currentCarouselIndexRef.current = idx
    }

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

        lastScrollPos.current = window.scrollY
        flushSync(() => setActiveSetId(setId))
        window.scrollTo(0, 0)

        const slot = document.getElementById('dynamic-island-hero-slot')
        const destImg = slot?.querySelector('img')
        const setScope = setViewRef.current
        const movingEl = movingPreviewElRef.current
        if (!slot || !destImg || !setScope || !movingEl) {
          isTransitioningRef.current = false
          setIsTransitioning(false)
          return
        }

        // Hide the real destination image so we can animate the proxy in its place.
        gsap.set(destImg, { opacity: 0 })

        // Capture the proxy's current (overlay) state, then reparent into the final slot.
        // This makes the end position accurate even while the Dynamic Island is resizing.
        const proxyState = Flip.getState(movingEl, { props: 'borderRadius,boxShadow' })

        slot.appendChild(movingEl)
        movingEl.style.position = 'absolute'
        movingEl.style.left = '0'
        movingEl.style.top = '0'
        movingEl.style.width = '100%'
        movingEl.style.height = '100%'
        movingEl.style.transform = ''

        const toRadius = window.getComputedStyle(destImg).borderRadius
        gsap.set(movingEl, { borderRadius: toRadius })

        Flip.from(proxyState, {
          targets: movingEl,
          duration: 0.9,
          ease: 'power3.inOut',
          absolute: true,
          props: 'borderRadius,boxShadow',
          onStart: () => {
            // Match the Dynamic Island hero (no base zoom) by the end.
            const img = movingEl.querySelector('img')
            if (img) {
              gsap.to(img, {
                scale: 1,
                duration: 0.9,
                ease: 'power3.inOut',
                overwrite: 'auto',
              })
            }
          },
          onComplete: () => {
            gsap.set(destImg, { opacity: 1 })
            if (movingEl.parentElement) movingEl.parentElement.removeChild(movingEl)

            // Restore flip-target in carousel in case we navigate back
            if (clickedItem) {
              const flipTarget = clickedItem.querySelector('.flip-target') as HTMLElement
              if (flipTarget) gsap.set(flipTarget, { clearProps: 'opacity', opacity: 1 })
            }
            isTransitioningRef.current = false
            setIsTransitioning(false)
          },
          onInterrupt: () => {
            if (clickedItem) {
              const flipTarget = clickedItem.querySelector('.flip-target') as HTMLElement
              if (flipTarget) gsap.set(flipTarget, { clearProps: 'opacity', opacity: 1 })
            }
            // If interrupted, don't leave the island hero hidden.
            gsap.set(destImg, { clearProps: 'opacity', opacity: 1 })
            isTransitioningRef.current = false
            setIsTransitioning(false)
          },
        })

        // Ensure movingEl has the correct initial border radius (from carousel)
        // and final border radius (from dynamic island) is handled by Flip.fit if we set it on movingEl?
        // Flip.fit matches the target state. destImg has borderRadius: 4px.
        // movingEl has borderRadius: 18px (from carousel).
        // So props: 'borderRadius' should work.


        const gridEl = setScope.querySelector<HTMLElement>('.set-grid')
        const gridItems = Array.from(setScope.querySelectorAll<HTMLElement>('[data-set-anim="grid"]'))

        // Defensive: if the grid container ever gets autoAlpha:0 applied (opacity:0 + visibility:hidden),
        // the items will animate but remain invisible. Force it visible on entry.
        if (gridEl) {
          gsap.killTweensOf(gridEl)
          gsap.set(gridEl, { autoAlpha: 1, overwrite: 'auto' })
        }
        
        // Removed header/backBtn animations as they are in DynamicIsland now


        if (gridItems.length) {
          const count = gridItems.length
          const width = window.innerWidth
          const xPositions = gsap.utils.shuffle(
            Array.from({ length: count }, (_, i) => {
              const pos = (i / count) * width
              return pos + gsap.utils.random(0, width / count)
            }),
          )

          const gridTween = gsap.from(gridItems, {
            x: (index: number, target: HTMLElement) => {
              const rect = target.getBoundingClientRect()
              const startX = xPositions[index]
              return startX - (rect.left + rect.width / 2)
            },
            y: (_: number, target: HTMLElement) => {
              const rect = target.getBoundingClientRect()
              const startY = window.innerHeight + 200
              return startY - rect.top
            },
            rotation: () => gsap.utils.random(-15, 15),
            opacity: 0,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.03,
            delay: 0.85,
            overwrite: 'auto',
          })

          // Defensive: if anything interrupts the tween before it finishes, make sure
          // the grid can't get stuck invisible.
          gridTween.eventCallback('onComplete', () => {
            gsap.set(gridItems, { clearProps: 'opacity' })
          })
          gsap.delayedCall(2.2, () => {
            gsap.set(gridItems, { opacity: 1, clearProps: 'opacity' })
          })
        }
        // Keep transition locked until the hero FLIP finishes.
      },
      onInterrupt: () => {
        if (root) gsap.set(root, { pointerEvents: '' })
        isTransitioningRef.current = false
        setIsTransitioning(false)
      },
    })

    if (root) gsap.set(root, { pointerEvents: 'none' })
    if (clickedItem) gsap.set(clickedItem, { zIndex: 2 })

    // Give the hover/parallax a moment to settle back to flat before we start moving anything.
    const settleDuration = 0
    if (clickedImg) {
      tl.to(
        clickedImg,
        {
          // Keep the base zoom so the image doesn't "shrink" right before the FLIP.
          scale: basePreviewImgScale,
          duration: settleDuration,
          ease: 'power2.out',
          overwrite: 'auto',
        },
        0,
      )
    }

    // Subtle “lock-in” on the clicked preview.
    tl.to(
      clickedButton,
      { scale: 0.985, duration: 0.08, ease: 'power2.out', transformOrigin: 'center center' },
      settleDuration,
    ).to(
      clickedButton,
      { scale: 1, duration: 0.22, ease: 'power2.out', transformOrigin: 'center center' },
      settleDuration + 0.08,
    )

    // Neighbors ease offscreen while the clicked preview stays.
    const duration = 0.55
    const ease = 'power3.inOut'

    const meta = clickedItem?.querySelector('.hscroll-meta')

    if (meta) {
      tl.to(
        meta,
        {
          y: 20,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
        },
        0,
      )
    }

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

    // Hold for the neighbor animations to complete.
    tl.to({}, { duration }, 0)
    })
  }

  const closeSet = useCallback(() => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true
    setIsTransitioning(true)
    setClosePhase('grid-exit')
    disablePreviewParallax()

    // Ensure we restore the carousel centered on the set we're closing.
    if (activeSetId) {
      const idx = sets.findIndex((s) => s.id === activeSetId)
      if (idx >= 0) currentCarouselIndexRef.current = idx
    }

    const setScope = setViewRef.current
    const movingEl = movingPreviewElRef.current

    if (!setScope || !movingEl) {
      setActiveSetId(null)
      isTransitioningRef.current = false
      setIsTransitioning(false)
      setClosePhase('idle')
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        const currentSetId = activeSetId

        // The set grid has finished exiting; we're about to start the hero FLIP back.
        setClosePhase('hero-exit')

        // Capture the start position from the Dynamic Island hero slot BEFORE unmount.
        const slot = document.getElementById('dynamic-island-hero-slot')
        const slotImg = slot?.querySelector('img') as HTMLImageElement | null
        const overlay = overlayRef.current

        if (!currentSetId || !slot || !slotImg || !overlay) {
          flushSync(() => setActiveSetId(null))
          isTransitioningRef.current = false
          setIsTransitioning(false)
          setClosePhase('idle')
          enablePreviewParallax()
          return
        }

        const slotRect = slot.getBoundingClientRect()

        // Ensure a single moving element exists.
        if (!movingPreviewElRef.current) {
          const el = document.createElement('div')
          el.className = 'moving-preview'
          const img = document.createElement('img')
          el.appendChild(img)
          movingPreviewElRef.current = el
        }

        const movingEl = movingPreviewElRef.current
        if (!movingEl) {
          flushSync(() => setActiveSetId(null))
          isTransitioningRef.current = false
          setIsTransitioning(false)
          setClosePhase('idle')
          enablePreviewParallax()
          return
        }

        // Point the proxy at the same hero image.
        const set = getPhotoSet(currentSetId)
        const hero = set?.photos?.[0]
        const proxyImg = movingEl.querySelector('img')
        if (proxyImg && hero) {
          proxyImg.src = hero.src
          proxyImg.alt = hero.alt ?? ''
          gsap.set(proxyImg, { scale: 1, transformOrigin: 'center center', force3D: true })
        }

        overlay.appendChild(movingEl)
        movingEl.style.position = 'absolute'
        movingEl.style.left = `${slotRect.left}px`
        movingEl.style.top = `${slotRect.top}px`
        movingEl.style.width = `${slotRect.width}px`
        movingEl.style.height = `${slotRect.height}px`
        movingEl.style.transform = ''
        movingEl.style.borderRadius = window.getComputedStyle(slotImg).borderRadius || '6px'
        gsap.set(movingEl, { opacity: 1 })
        gsap.set(slotImg, { opacity: 0 })

        closingSetIdRef.current = currentSetId
        flushSync(() => setActiveSetId(null))

        const root = rootRef.current
        const track = trackRef.current

        if (!root || !track || !overlay) {
          isTransitioningRef.current = false
          setIsTransitioning(false)
          setClosePhase('idle')
          return
        }

        const targetWrapper = track.querySelector(`[data-flip-id="set-preview-${currentSetId}"]`)
        const targetImg = targetWrapper?.querySelector('img')

        if (targetWrapper && targetImg) {
          // Use the wrapper rect (the visible clipped frame), not the scaled <img> rect.
          // Otherwise, the moving element lands at the scaled image size, then snaps to
          // the smaller wrapper when we swap back to the real preview.
          const targetRect = targetWrapper.getBoundingClientRect()

          // Capture this as the "from" state for Flip (start = Dynamic Island hero).
          const state = Flip.getState(movingEl, { props: 'borderRadius,boxShadow' })

          // Set movingEl to the END position (the carousel item).
          movingEl.style.left = `${targetRect.left}px`
          movingEl.style.top = `${targetRect.top}px`
          movingEl.style.width = `${targetRect.width}px`
          movingEl.style.height = `${targetRect.height}px`
          movingEl.style.borderRadius = '18px'

          // Explicitly tween corner radius + inner image zoom to match carousel.
          const fromRadius = window.getComputedStyle(slotImg).borderRadius || '6px'
          const toRadius = '18px'
          const proxyImg2 = movingEl.querySelector('img')
          if (proxyImg2) {
            gsap.to(proxyImg2, {
              scale: basePreviewImgScale,
              duration: 0.9,
              ease: 'power3.inOut',
              overwrite: 'auto',
            })
          }
          gsap.fromTo(
            movingEl,
            { borderRadius: fromRadius },
            { borderRadius: toRadius, duration: 0.9, ease: 'power3.inOut', overwrite: 'auto' },
          )

          const rootRect = root.getBoundingClientRect()

          const offscreen = (rootRect.width ?? window.innerWidth) + 80
          const leftSide: HTMLElement[] = []
          const rightSide: HTMLElement[] = []

          const clickedItem = targetWrapper.closest('.hscroll-item') as HTMLElement
          if (clickedItem) {
            const clickedRect = clickedItem.getBoundingClientRect()
            const clickedCenterX = clickedRect.left + clickedRect.width / 2

            const items = Array.from(track.querySelectorAll<HTMLElement>('.hscroll-item'))

            for (const item of items) {
              if (item === clickedItem) continue
              const rect = item.getBoundingClientRect()
              if (rect.right > rootRect.left - 100 && rect.left < rootRect.right + 100) {
                const centerX = rect.left + rect.width / 2
                if (centerX < clickedCenterX) leftSide.push(item)
                else rightSide.push(item)
              }
            }
          }

          if (leftSide.length) {
            gsap.set(leftSide, {
              x: (_: number, target: Element) => {
                const w = (target as HTMLElement).getBoundingClientRect().width
                return -(offscreen + w)
              },
              opacity: 0,
            })
          }
          if (rightSide.length) {
            gsap.set(rightSide, {
              x: (_: number, target: Element) => {
                const w = (target as HTMLElement).getBoundingClientRect().width
                return offscreen + w
              },
              opacity: 0,
            })
          }

          // Ensure the clicked item is visible
          if (clickedItem) {
            gsap.set(clickedItem, { clearProps: 'opacity,transform', opacity: 1 })
            // Hide the background box of the preview button while transitioning
            const btn = clickedItem.querySelector('.hscroll-preview') as HTMLElement
            if (btn) gsap.set(btn, { background: 'transparent', borderColor: 'transparent', boxShadow: 'none' })
            // Hide the flip-target wrapper to prevent its shadow from showing during animation
            const flipTarget = clickedItem.querySelector('.flip-target') as HTMLElement
            if (flipTarget) gsap.set(flipTarget, { opacity: 0 })
          }
          if (targetImg) {
            gsap.set(targetImg, { opacity: 0 })
          }

          // Animate in the meta text (title/subtitle)
          if (clickedItem) {
            const meta = clickedItem.querySelector('.hscroll-meta')
            if (meta) {
              gsap.fromTo(
                meta,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.5 },
              )
            }
          }

          Flip.from(state, {
            targets: movingEl,
            duration: 0.9,
            ease: 'power3.inOut',
            scale: true,
            absolute: true,
            props: 'borderRadius,boxShadow',
            onComplete: () => {
              if (movingEl.parentElement) movingEl.parentElement.removeChild(movingEl)
              
              closingSetIdRef.current = null
              
              if (targetImg) gsap.set(targetImg, { clearProps: 'opacity', opacity: 1 })
              gsap.set(slotImg, { clearProps: 'opacity', opacity: 1 })
              if (clickedItem) {
                const btn = clickedItem.querySelector('.hscroll-preview') as HTMLElement
                if (btn) gsap.set(btn, { clearProps: 'background,borderColor,boxShadow' })
                const flipTarget = clickedItem.querySelector('.flip-target') as HTMLElement
                if (flipTarget) gsap.set(flipTarget, { clearProps: 'opacity', opacity: 1 })
              }
              isTransitioningRef.current = false
              setIsTransitioning(false)
              setClosePhase('idle')

              // If there are no neighbor settle animations, it's safe to re-enable parallax now.
              if (leftSide.length === 0 && rightSide.length === 0) {
                enablePreviewParallax()
              }
            },
            onInterrupt: () => {
              // Defensive: ensure we don't strand the gallery with parallax disabled.
              isTransitioningRef.current = false
              setIsTransitioning(false)
              setClosePhase('idle')
              gsap.set(slotImg, { clearProps: 'opacity', opacity: 1 })
              enablePreviewParallax()
            },
          })

          const neighbors = [...leftSide, ...rightSide]
          if (neighbors.length) {
            gsap.to(neighbors, {
              x: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'power3.inOut',
              delay: 0.2,
              onComplete: () => {
                gsap.set(neighbors, { clearProps: 'all' })
                // Only allow hover parallax after everything has settled.
                enablePreviewParallax()
              },
              onInterrupt: () => {
                // If this tween gets interrupted, don't leave parallax disabled.
                enablePreviewParallax()
              },
            })
          }

          // Last-resort safety: if any of the above completion callbacks are skipped,
          // re-enable hover parallax after the close animation window.
          gsap.delayedCall(1.6, () => {
            if (!isTransitioningRef.current) enablePreviewParallax()
          })
        } else {
          if (movingEl.parentElement) movingEl.parentElement.removeChild(movingEl)
          isTransitioningRef.current = false
          setIsTransitioning(false)
          setClosePhase('idle')
          enablePreviewParallax()
        }
      },
      onInterrupt: () => {
        isTransitioningRef.current = false
        setIsTransitioning(false)
        setClosePhase('idle')
        enablePreviewParallax()
      },
    })

    const gridItems = setScope.querySelectorAll('[data-set-anim="grid"]')
    if (gridItems.length) {
      const count = gridItems.length
      const width = window.innerWidth
      const xPositions = gsap.utils.shuffle(
        Array.from({ length: count }, (_, i) => {
          const pos = (i / count) * width
          return pos + gsap.utils.random(0, width / count)
        }),
      )

      tl.to(
        gridItems,
        {
          x: (index: number, target: HTMLElement) => {
            const rect = target.getBoundingClientRect()
            const endX = xPositions[index]
            return endX - (rect.left + rect.width / 2)
          },
          y: (_: number, target: HTMLElement) => {
            const rect = target.getBoundingClientRect()
            const endY = window.innerHeight + 200
            return endY - rect.top
          },
          rotation: () => gsap.utils.random(-15, 15),
          opacity: 0,
          duration: 0.5,
          ease: 'power3.in',
          stagger: 0.01,
        },
        0,
      )
    }
  }, [
    activeSetId,
    sets,
    disablePreviewParallax,
    setActiveSetId,
    enablePreviewParallax,
    setClosePhase,
    setIsTransitioning,
  ])

  useEffect(() => {
    registerCloseHandler(closeSet)
  }, [registerCloseHandler, closeSet])

  return (
    <>
      <div className="flip-overlay" ref={overlayRef} aria-hidden="true" />

      {activeSetId ? (
        activeSet ? (
          <section className="set-page" ref={setViewRef}>
            <div className="set-header" style={{ minHeight: '80px' }}>
              {/* Header content moved to DynamicIsland */}
            </div>

            <div className="set-grid" role="list">
              {activeSet.photos.slice(1).map((photo, index) => {
                const t = gridTransforms[index]
                return (
                  <div
                    key={photo.id}
                    className="set-grid-item"
                    role="listitem"
                    data-set-anim="grid"
                    style={{
                      left: t?.x ?? 0,
                      top: t?.y ?? 0,
                      width: t?.width ?? 300,
                      height: t?.height ?? 240,
                      transform: t?.rotation || t?.scale !== 1
                        ? `rotate(${t.rotation}deg) scale(${t.scale})`
                        : undefined,
                    }}
                  >
                    <img src={photo.src} alt={photo.alt} loading="lazy" />
                  </div>
                )
              })}
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
          <div className="hscroll-pin" ref={rootRef}>
            <div className="hscroll">
              <div className="hscroll-track" ref={trackRef}>
                {sets.map((set) => {
                  const preview = getSetPreviewPhoto(set)
                  const flipId = `set-preview-${set.id}`
                  const isClosing = closingSetIdRef.current === set.id

                  return (
                    <article
                      key={set.id}
                      className="hscroll-item"
                      data-set-name={set.name}
                      data-set-location={set.location}
                    >
                      <button
                        className="hscroll-preview"
                        type="button"
                        onClick={(e) => {
                          setHoverLabelVisible(false)
                          // If you click a non-centered item, center it first.
                          const current = currentCarouselIndexRef.current
                          const items = Array.from(
                            trackRef.current?.querySelectorAll<HTMLElement>('.hscroll-item') ?? [],
                          )
                          const clickedItem = e.currentTarget.closest('.hscroll-item') as HTMLElement | null
                          const clickedIndex = clickedItem ? items.indexOf(clickedItem) : -1
                          if (clickedIndex >= 0 && clickedIndex !== current) {
                            goToIndexRef.current?.(clickedIndex)
                            return
                          }
                          openSetInPlace(set.id, e.currentTarget)
                        }}
                        aria-label={`Open ${set.name}`}
                        style={
                          isClosing
                            ? { background: 'transparent', borderColor: 'transparent', boxShadow: 'none' }
                            : undefined
                        }
                      >
                        <div className="flip-target" data-flip-id={flipId}>
                          <img
                            src={preview.src}
                            alt={preview.alt}
                            style={isClosing ? { opacity: 0 } : undefined}
                          />
                        </div>
                      </button>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="hover-label" ref={hoverLabelRef} aria-hidden="true">
            <div className="hover-label-inner">
              <div className="hover-label-row hover-label-title" aria-hidden="true">
                {hoverLabelContent.title.split('').map((ch, i) => (
                  <span key={`t-${i}`} className="hover-label-char hover-label-char--title">
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                ))}
              </div>
              <div className="hover-label-row hover-label-subtitle" aria-hidden="true">
                {hoverLabelContent.subtitle.split('').map((ch, i) => (
                  <span key={`s-${i}`} className="hover-label-char hover-label-char--subtitle">
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
