const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

let scriptPromise: Promise<void> | null = null

/** Injects the Cloudflare Turnstile script into <head> exactly once. */
export function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  if (window.turnstile) return Promise.resolve()

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)
      if (existing) {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile script')))
        return
      }

      const script = document.createElement('script')
      script.src = TURNSTILE_SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Turnstile script'))
      document.head.appendChild(script)
    })
  }

  return scriptPromise
}
