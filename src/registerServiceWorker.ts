export function registerServiceWorker(): void {
  if (!navigator.serviceWorker) return
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
