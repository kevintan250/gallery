import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SetPage from './pages/SetPage'
import { GalleryProvider } from './context/GalleryContext'
import DynamicIsland from './components/DynamicIsland'

export default function AppShell() {
  return (
    <GalleryProvider>
      <div className="page">
        <div className="side-bar left" />
        <div className="side-bar right" />
        <header className="topbar" style={{ justifyContent: 'center' }}>
          <DynamicIsland />
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/set/:id" element={<SetPage />} />
        </Routes>
      </div>
    </GalleryProvider>
  )
}
