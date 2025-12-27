import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SetPage from './pages/SetPage'

export default function AppShell() {
  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">Gallery</div>
        <nav className="menu">
          <button className="ghost small">About</button>
          <button className="ghost small">Contact</button>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/set/:id" element={<SetPage />} />
      </Routes>
    </div>
  )
}
