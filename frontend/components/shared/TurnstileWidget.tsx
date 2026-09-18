import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { loadTurnstileScript } from '../../lib/turnstile/loadTurnstileScript'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire: () => void
  onError: () => void
}

export interface TurnstileWidgetHandle {
  /** Resets the widget so a fresh (single-use) token can be issued after a failed submit. */
  reset: () => void
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(function TurnstileWidget(
  { onVerify, onExpire, onError },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current)
    },
  }), [])

  useEffect(() => {
    let cancelled = false

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
          callback: onVerify,
          'expired-callback': onExpire,
          'error-callback': onError,
        })
      })
      .catch(() => {
        if (!cancelled) onError()
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} />
})

export default TurnstileWidget
