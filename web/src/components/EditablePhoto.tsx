import { useCallback, useEffect, useRef, useState } from 'react'
import type { Photo } from '../data/photoSets'

interface EditablePhotoProps {
  photo: Photo
  isEditMode: boolean
  onUpdate: (photoId: string, data: Partial<Photo>) => void
  canvasScale?: number
}

export default function EditablePhoto({ photo, isEditMode, onUpdate, canvasScale = 1 }: EditablePhotoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialX: 0, initialY: 0 })
  const [resizeStart, setResizeStart] = useState({ 
    x: 0, 
    y: 0, 
    initialWidth: 0, 
    initialHeight: 0,
    aspectRatio: 1 
  })

  // Calculate position and size
  const x = photo.x ?? 0
  const y = photo.y ?? 0
  const width = photo.width ?? 400
  const height = photo.height ?? 300

  // Drag handlers
  const handleMouseDownDrag = useCallback((e: React.MouseEvent) => {
    if (!isEditMode || isResizing) return
    e.preventDefault()
    e.stopPropagation()
    
    // Select this photo
    setIsSelected(true)
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initialX: x,
      initialY: y,
    })
  }, [isEditMode, isResizing, x, y])

  // Resize handlers
  const handleMouseDownResize = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    const aspectRatio = width / height
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      initialWidth: width,
      initialHeight: height,
      aspectRatio,
    })
  }, [isEditMode, width, height])

  // Mouse move handler
  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        
        // Adjust for canvas scale - divide by scale to get canvas coordinates
        const scaledDeltaX = deltaX / canvasScale
        const scaledDeltaY = deltaY / canvasScale
        
        // Snap to nearest 25
        const newX = Math.round((dragStart.initialX + scaledDeltaX) / 25) * 25
        const newY = Math.round((dragStart.initialY + scaledDeltaY) / 25) * 25
        
        onUpdate(photo.id, { x: newX, y: newY })
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        
        // Use the larger delta to determine size change, adjusted for canvas scale
        const delta = Math.max(deltaX, deltaY) / canvasScale
        
        // Calculate new width maintaining aspect ratio, snap to nearest 50
        const calculatedWidth = Math.max(100, resizeStart.initialWidth + delta)
        const newWidth = Math.round(calculatedWidth / 50) * 50
        const newHeight = Math.round(newWidth / resizeStart.aspectRatio)
        
        onUpdate(photo.id, { width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, resizeStart, photo.id, onUpdate, canvasScale])

  // Deselect when clicking outside (on background)
  useEffect(() => {
    if (!isEditMode || !isSelected) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click is outside this photo
      if (containerRef.current && !containerRef.current.contains(target)) {
        // Only deselect if clicking on the canvas/background, not another photo
        if (target.classList.contains('set-canvas') || 
            target.classList.contains('set-canvas-container') ||
            target.classList.contains('set-grid')) {
          setIsSelected(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditMode, isSelected])

  return (
    <div
      ref={containerRef}
      className={`set-grid-item ${isEditMode ? 'editable' : ''} ${(isSelected || isHovered) && isEditMode ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
        borderWidth: (isSelected || isHovered) && isEditMode ? `${5 / canvasScale}px` : undefined,
        boxShadow: (isSelected || isHovered) && isEditMode 
          ? `0 ${20 / canvasScale}px ${48 / canvasScale}px rgba(59, 130, 246, 0.5), 0 0 0 ${2 / canvasScale}px rgba(59, 130, 246, 0.2)`
          : undefined,
      }}
      onMouseDown={handleMouseDownDrag}
      onMouseEnter={() => {
        if (isEditMode) setIsHovered(true)
      }}
      onMouseLeave={() => {
        if (isEditMode) setIsHovered(false)
      }}
      onClick={(e) => {
        if (isEditMode) {
          e.stopPropagation()
          setIsSelected(true)
        }
      }}
      role="listitem"
    >
      <img 
        src={photo.src} 
        alt={photo.alt} 
        loading="lazy"
        draggable={false}
        style={{ pointerEvents: isEditMode ? 'none' : 'auto' }}
      />
      
      {isEditMode && (isSelected || isHovered) && (
        <>
          {/* Resize handle - bottom right corner */}
          <div
            className="resize-handle"
            onMouseDown={handleMouseDownResize}
            style={{
              position: 'absolute',
              right: `${-24 / canvasScale}px`,
              bottom: `${-24 / canvasScale}px`,
              width: `${56 / canvasScale}px`,
              height: `${56 / canvasScale}px`,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: `${4 / canvasScale}px solid white`,
              borderRadius: '50%',
              cursor: 'nwse-resize',
              zIndex: 10,
              boxShadow: `0 ${6 / canvasScale}px ${20 / canvasScale}px rgba(59, 130, 246, 0.8), 0 0 0 ${3 / canvasScale}px rgba(59, 130, 246, 0.3)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)'
              e.currentTarget.style.boxShadow = `0 ${8 / canvasScale}px ${24 / canvasScale}px rgba(59, 130, 246, 1), 0 0 0 ${4 / canvasScale}px rgba(59, 130, 246, 0.4)`
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = `0 ${6 / canvasScale}px ${20 / canvasScale}px rgba(59, 130, 246, 0.8), 0 0 0 ${3 / canvasScale}px rgba(59, 130, 246, 0.3)`
              }
            }}
          >
            {/* Resize icon */}
            <svg width={24 / canvasScale} height={24 / canvasScale} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </div>
          
          {/* Photo info overlay */}
          <div
            className="photo-info-overlay"
            style={{
              position: 'absolute',
              top: `${8 / canvasScale}px`,
              left: `${8 / canvasScale}px`,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: `${4 / canvasScale}px ${8 / canvasScale}px`,
              borderRadius: `${4 / canvasScale}px`,
              fontSize: `${11 / canvasScale}px`,
              fontFamily: 'monospace',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {photo.id}
            <br />
            x: {Math.round(x)}, y: {Math.round(y)}
            <br />
            w: {Math.round(width)}, h: {Math.round(height)}
          </div>
        </>
      )}
    </div>
  )
}
