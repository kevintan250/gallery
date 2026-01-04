import type { GalleryContextType } from '../context/GalleryContextCore'
import { photoSets } from '../data/photoSets'

let galleryContext: GalleryContextType | null = null

export function registerGalleryContext(context: GalleryContextType) {
  galleryContext = context
}

// Global console functions
declare global {
  interface Window {
    galleryEditMode: (enabled: boolean) => void
    gallerySaveEdits: () => void
    galleryExportData: () => void
  }
}

// Toggle edit mode
window.galleryEditMode = (enabled: boolean) => {
  if (!galleryContext) {
    console.error('Gallery context not available')
    return
  }
  galleryContext.setIsEditMode(enabled)
  console.log(`Edit mode ${enabled ? 'enabled' : 'disabled'}`)
}

// Save current edits and show the data to copy
window.gallerySaveEdits = () => {
  if (!galleryContext) {
    console.error('Gallery context not available')
    return
  }

  const { activeSetId, editedPhotos } = galleryContext
  
  if (!activeSetId) {
    console.error('No active set')
    return
  }

  const set = photoSets.find(s => s.id === activeSetId)
  if (!set) {
    console.error('Set not found')
    return
  }

  // Create updated photos array
  const updatedPhotos = set.photos.map(photo => {
    if (editedPhotos[photo.id]) {
      return { ...photo, ...editedPhotos[photo.id] }
    }
    return photo
  })

  console.log('=== UPDATED PHOTO DATA ===')
  console.log('Copy this data and update your photoSets.ts file:')
  console.log('')
  console.log(`photos: ${JSON.stringify(updatedPhotos, null, 2)}`)
  console.log('')
  console.log('=== END ===')

  return updatedPhotos
}

// Export all data for the current set
window.galleryExportData = () => {
  if (!galleryContext) {
    console.error('Gallery context not available')
    return
  }

  const { activeSetId, editedPhotos } = galleryContext
  
  if (!activeSetId) {
    console.error('No active set')
    return
  }

  const set = photoSets.find(s => s.id === activeSetId)
  if (!set) {
    console.error('Set not found')
    return
  }

  // Create updated photos array
  const updatedPhotos = set.photos.map(photo => {
    if (editedPhotos[photo.id]) {
      return { ...photo, ...editedPhotos[photo.id] }
    }
    return photo
  })

  const updatedSet = {
    ...set,
    photos: updatedPhotos
  }

  console.log('=== COMPLETE SET DATA ===')
  console.log(JSON.stringify(updatedSet, null, 2))
  console.log('=== END ===')

  return updatedSet
}

// Log available commands on load
console.log('%c🎨 Gallery Editor Commands Available', 'color: #3b82f6; font-size: 14px; font-weight: bold')
console.log('%cgalleryEditMode(true/false)', 'color: #10b981') 
console.log('  Toggle editing mode on/off')
console.log('%cgallerySaveEdits()', 'color: #10b981')
console.log('  Save and export current edits for the photos array')
console.log('%cgalleryExportData()', 'color: #10b981')
console.log('  Export complete set data including edits')
