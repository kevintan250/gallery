export type Photo = {
  id: string
  src: string
  alt: string
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  scale?: number
}

export type PhotoSet = {
  id: string
  name: string
  location: string
  description: string
  accent: string
  photos: Photo[]
}

export const photoSets: PhotoSet[] = [
  {
    id: 'dunes',
    name: 'Dunes Afterlight',
    location: 'Gobi Desert, Mongolia',
    description:
      'Long-lens minimalism where the wind redraws the dunes each hour. Warm gradients, razor edges, and dust in the air.',
    accent: '#f2a65a',
    photos: [
      {
        id: 'dunes-1',
        src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
        alt: 'Soft dunes at sunset',
      },
      {
        id: 'dunes-2',
        src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
        alt: 'Rippling sand lines',
      },
      {
        id: 'dunes-3',
        src: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80',
        alt: 'Dune crest shadows',
      },
      {
        id: 'dunes-4',
        src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        alt: 'Twilight haze over dunes',
      },
      {
        id: 'dunes-5',
        src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
        alt: 'Sculpted ridge line',
      },
    ],
  },
  {
    id: 'nocturnes',
    name: 'City Nocturnes',
    location: 'Hong Kong / Tokyo',
    description:
      'Urban geometry at blue hour. Neon fog, hard reflections, and plenty of negative space to let the lights breathe.',
    accent: '#6dd3ff',
    photos: [
      {
        id: 'noct-1',
        src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
        alt: 'Neon-lit building corner',
      },
      {
        id: 'noct-2',
        src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
        alt: 'Moody street with light trails',
      },
      {
        id: 'noct-3',
        src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80',
        alt: 'Glass tower at night',
      },
      {
        id: 'noct-4',
        src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
        alt: 'Blue building grid',
      },
      {
        id: 'noct-5',
        src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
        alt: 'Rainy street reflections',
      },
    ],
  },
  {
    id: 'ice',
    name: 'Ice and Ember',
    location: 'Vatnajokull, Iceland',
    description:
      'Glacial textures, long exposures, and volcanic sand at midnight sun. Cold blues with a streak of copper.',
    accent: '#9cd6ff',
    photos: [
      {
        id: 'ice-1',
        src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        alt: 'Glacial lagoon',
      },
      {
        id: 'ice-2',
        src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
        alt: 'Ice on black sand',
      },
      {
        id: 'ice-3',
        src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
        alt: 'Blue glacier wall',
      },
      {
        id: 'ice-4',
        src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
        alt: 'Storm over icebergs',
      },
      {
        id: 'ice-5',
        src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
        alt: 'Sunset streak on ice',
      },
    ],
  },
]

export function getPhotoSet(id: string): PhotoSet | undefined {
  return photoSets.find((set) => set.id === id)
}

export function getSetPreviewPhoto(set: PhotoSet): Photo {
  return set.photos[0]
}
