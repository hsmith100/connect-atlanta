import type { loadTurnstileScript as LoadTurnstileScript } from './loadTurnstileScript'

let loadTurnstileScript: typeof LoadTurnstileScript

beforeEach(() => {
  jest.resetModules()
  // Fresh module instance per test so the internal script-promise cache doesn't leak across tests.
  loadTurnstileScript = require('./loadTurnstileScript').loadTurnstileScript
})

afterEach(() => {
  document.head.querySelectorAll('script[src*="turnstile"]').forEach(s => s.remove())
  delete (window as { turnstile?: unknown }).turnstile
})

describe('loadTurnstileScript', () => {
  it('resolves immediately without injecting a script when window.turnstile already exists', async () => {
    window.turnstile = { render: jest.fn(), remove: jest.fn(), reset: jest.fn() }
    await loadTurnstileScript()
    expect(document.head.querySelector('script[src*="turnstile"]')).toBeNull()
  })

  it('injects exactly one script tag pointing at the Turnstile API', async () => {
    const promise = loadTurnstileScript()
    const script = document.head.querySelector<HTMLScriptElement>('script[src*="turnstile"]')
    expect(script).not.toBeNull()
    expect(script?.src).toBe('https://challenges.cloudflare.com/turnstile/v0/api.js')
    script?.dispatchEvent(new Event('load'))
    await promise
  })

  it('rejects when the script fails to load', async () => {
    const promise = loadTurnstileScript()
    const script = document.head.querySelector('script[src*="turnstile"]')
    script?.dispatchEvent(new Event('error'))
    await expect(promise).rejects.toThrow('Failed to load Turnstile script')
  })
})
