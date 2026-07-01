import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { TripShell } from './pages/TripShell'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/t/:shareCode" element={<TripShell />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
