import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SetPage from './pages/SetPage'
import { GalleryProvider } from './context/GalleryContext'
import DynamicIsland from './components/DynamicIsland'

export default function AppShell() {
  return (
    <GalleryProvider>
      <div className="page">
        <div style={{ position: 'fixed', top: '24px', left: '0', right: '0', display: 'flex', justifyContent: 'center', zIndex: 100, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <DynamicIsland />
          </div>
        </div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/set/:id" element={<SetPage />} />
        </Routes>
      </div>
    </GalleryProvider>
  )
}
