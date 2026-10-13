import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { CreateTrip } from './pages/CreateTrip'
import { JoinTrip } from './pages/JoinTrip'
import { TripShell } from './pages/TripShell'
import { OfflineBanner } from './components/OfflineBanner'
import { ThemeProvider } from './theme/ThemeContext'
import { isSupabaseConfigured } from './lib/supabaseClient'

const ConceptPassStack = lazy(() =>
  import('./pages/hero-previews/ConceptPassStack').then((module) => ({ default: module.ConceptPassStack })),
)
const ConceptCardCarousel = lazy(() =>
  import('./pages/hero-previews/ConceptCardCarousel').then((module) => ({ default: module.ConceptCardCarousel })),
)
const ConceptRouteMap = lazy(() =>
  import('./pages/hero-previews/ConceptRouteMap').then((module) => ({ default: module.ConceptRouteMap })),
)

function AppShell() {
  const preview = useLocation().pathname.startsWith('/preview/')
  return (
    <>
      {!preview && <OfflineBanner />}
      {!preview && !isSupabaseConfigured && (
        <p className="demo-banner" role="status">
          示範模式：未連接雲端，行程只保存在這部裝置。分享連結只在同一部瀏覽器有效。
        </p>
      )}
      <Suspense fallback={<p className="hp-loading">載入預覽…</p>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/new" element={<CreateTrip />} />
          <Route path="/join" element={<JoinTrip />} />
          <Route path="/t/:shareCode" element={<TripShell />} />
          <Route path="/preview/hero/1" element={<ConceptPassStack />} />
          <Route path="/preview/hero/2" element={<ConceptCardCarousel />} />
          <Route path="/preview/hero/3" element={<ConceptRouteMap />} />
        </Routes>
      </Suspense>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      {/* 入到 trip 之前（未有 share_code）用預設主題；TripShell 入面會用返個trip 自己 persist 嘅主題覆蓋呢個 */}
      <ThemeProvider themeId="cartography">
        <AppShell />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
