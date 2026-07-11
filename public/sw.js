// 基本離線處理：cache app shell，離線時導航請求 fallback 去 index.html
// （靠 client-side routing 接手），資料本身（Supabase）離線本身就讀唔到，
// 呢個 service worker 淨係保證個 app 唔會齋顯示白畫面/瀏覽器錯誤頁。
const CACHE_NAME = 'travel-app-shell-v3'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return
  // 媒體檔／Range request 唔好經 SW（會整跛 <audio>/<video> 串流），直接俾瀏覽器處理
  const pathname = new URL(event.request.url).pathname
  if (/\.(mp3|mp4|webm|ogg|wav|m4a)$/i.test(pathname)) return
  if (event.request.headers.has('range')) return

  // HTML／導航請求：network-first（確保攞到最新版），離線先 fallback 去 cache
  const isHTML = event.request.mode === 'navigate' || /\.html$/i.test(pathname) || pathname === '/'
  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match('/index.html'))),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached || caches.match('/index.html'))

      return cached || network
    }),
  )
})
