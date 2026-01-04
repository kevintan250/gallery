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
  previewPhotoId?: string
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
        "id": "dunes-1",
        "src": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
        "alt": "Soft dunes at sunset"
      },
      {
        "id": "dunes-2",
        "src": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
        "alt": "Rippling sand lines",
        "x": 7568,
        "y": 7421
      },
      {
        "id": "dunes-3",
        "src": "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80",
        "alt": "Dune crest shadows",
        "x": 7312,
        "y": 7368
      },
      {
        "id": "dunes-4",
        "src": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
        "alt": "Twilight haze over dunes",
        "x": 7722,
        "y": 7819,
        "width": 548,
        "height": 438
      },
      {
        "id": "dunes-5",
        "src": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
        "alt": "Sculpted ridge line",
        "x": 7176,
        "y": 7598
      }
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
  {
    id: 'afvsshowcase',
    name: 'AFVS Showcase',
    location: 'Various Locations',
    description:
      'A collection of featured photography showcasing diverse scenes and moments.',
    accent: '#ff8c42',
    photos: [ 
      {
        "id": "afvs-1",
        "src": "/src/assets/afvsshowcase/_MG_2673.jpg",
        "alt": "AFVS Showcase Photo 1",
        "width": 1700,
        "height": 1134,
        "x": 9675,
        "y": 8117
      },
      {
        "id": "afvs-2",
        "src": "/src/assets/afvsshowcase/_MG_3211.jpg",
        "alt": "AFVS Showcase Photo 2",
        "width": 1800,
        "height": 1201,
        "x": 5800,
        "y": 9575.5
      },
      {
        "id": "afvs-3",
        "src": "/src/assets/afvsshowcase/_MG_3530.jpg",
        "alt": "AFVS Showcase Photo 3",
        "width": 1800,
        "height": 1200,
        "x": 5800,
        "y": 8200
      },
      {
        "id": "afvs-4",
        "src": "/src/assets/afvsshowcase/_MG_3537.jpg",
        "alt": "AFVS Showcase Photo 4",
        "width": 1000,
        "height": 1501,
        "x": 8800,
        "y": 6575.5
      },
      {
        "id": "afvs-5",
        "src": "/src/assets/afvsshowcase/_MG_4138.jpg",
        "alt": "AFVS Showcase Photo 5",
        "width": 1150,
        "height": 1580,
        "x": 3600,
        "y": 6615
      },
      {
        "id": "afvs-6",
        "src": "/src/assets/afvsshowcase/_MG_4388.jpg",
        "alt": "AFVS Showcase Photo 6",
        "width": 1000,
        "height": 1501,
        "x": 10025,
        "y": 6575.5
      },
      {
        "id": "afvs-7",
        "src": "/src/assets/afvsshowcase/_MG_4446.jpg",
        "alt": "AFVS Showcase Photo 7",
        "width": 1700,
        "height": 2551,
        "x": 3850,
        "y": 8875.5
      },
      {
        "id": "afvs-8",
        "src": "/src/assets/afvsshowcase/_MG_4934.jpg",
        "alt": "AFVS Showcase Photo 8",
        "width": 1050,
        "height": 1486,
        "x": 7500,
        "y": 6568
      },
      {
        "id": "afvs-9",
        "src": "/src/assets/afvsshowcase/_MG_5113.jpg",
        "alt": "AFVS Showcase Photo 9",
        "width": 2350,
        "height": 1568,
        "x": 5525,
        "y": 6609
      },
      {
        "id": "afvs-10",
        "src": "/src/assets/afvsshowcase/Kevin Tan_Tree.tiff",
        "alt": "Kevin Tan Tree Photo",
        "width": 1750,
        "height": 2625,
        "x": 7775,
        "y": 8837.5
      }
    ]
  },
]

export function getPhotoSet(id: string): PhotoSet | undefined {
  return photoSets.find((set) => set.id === id)
}

export function getSetPreviewPhoto(set: PhotoSet): Photo {
  if (set.previewPhotoId) {
    const preview = set.photos.find(p => p.id === set.previewPhotoId)
    if (preview) return preview
  }
  return set.photos[0]
}
