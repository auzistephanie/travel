// 淨係喺 production build 先註冊 service worker。
// Dev server 底下 register 咗會 cache 住 Vite HMR 嘅 module response，
// 之後改完 code 個瀏覽器都可能仲係讀緊快取，睇落好似「改極都冇反應」。
export function registerServiceWorker(isProd: boolean = import.meta.env.PROD): void {
  if (!isProd) return
  if (!navigator.serviceWorker) return
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
