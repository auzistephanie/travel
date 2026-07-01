import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { CreateTrip } from './pages/CreateTrip'
import { JoinTrip } from './pages/JoinTrip'
import { TripShell } from './pages/TripShell'
import { OfflineBanner } from './components/OfflineBanner'

function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/new" element={<CreateTrip />} />
        <Route path="/join" element={<JoinTrip />} />
        <Route path="/t/:shareCode" element={<TripShell />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
