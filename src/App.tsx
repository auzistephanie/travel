import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { CreateTrip } from './pages/CreateTrip'
import { JoinTrip } from './pages/JoinTrip'
import { TripShell } from './pages/TripShell'
import { OfflineBanner } from './components/OfflineBanner'
import { ThemeProvider } from './theme/ThemeContext'
import { isSupabaseConfigured } from './lib/supabaseClient'

function App() {
  return (
    <BrowserRouter>
      {/* 入到 trip 之前（未有 share_code）用預設主題；TripShell 入面會用返個trip 自己 persist 嘅主題覆蓋呢個 */}
      <ThemeProvider themeId="cartography">
        <OfflineBanner />
        {!isSupabaseConfigured && (
          <p className="demo-banner" role="status">
            示範模式：未連接雲端，行程只保存在這部裝置。分享連結只在同一部瀏覽器有效。
          </p>
        )}
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/new" element={<CreateTrip />} />
          <Route path="/join" element={<JoinTrip />} />
          <Route path="/t/:shareCode" element={<TripShell />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
