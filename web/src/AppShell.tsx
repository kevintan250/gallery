import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SetPage from './pages/SetPage'

export default function AppShell() {
  return (
    <div className="page">
      <div className="side-bar left" />
      <div className="side-bar right" />
      <header className="topbar">
        <div className="brand">komplete.chaos</div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/set/:id" element={<SetPage />} />
      </Routes>
    </div>
  )
}
