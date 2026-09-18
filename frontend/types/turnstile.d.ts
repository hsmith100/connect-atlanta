export {}

interface TurnstileRenderOptions {
  sitekey: string
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: TurnstileRenderOptions) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
    }
  }
}
