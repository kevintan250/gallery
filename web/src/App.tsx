import './App.css'
import AppShell from './AppShell'
import { FlipProvider } from './flip/FlipProvider'

export default function App() {
  return (
    <FlipProvider>
      <AppShell />
    </FlipProvider>
  )
}
