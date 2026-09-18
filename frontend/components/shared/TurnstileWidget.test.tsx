import React from 'react'
import { createRef } from 'react'
import { render, waitFor } from '@testing-library/react'
import TurnstileWidget, { type TurnstileWidgetHandle } from './TurnstileWidget'

function mockTurnstile() {
  const render = jest.fn().mockReturnValue('widget-1')
  const remove = jest.fn()
  const reset = jest.fn()
  window.turnstile = { render, remove, reset }
  return { render, remove, reset }
}

afterEach(() => {
  delete (window as { turnstile?: unknown }).turnstile
})

describe('TurnstileWidget', () => {
  it('renders the widget via window.turnstile.render once the script is available', async () => {
    const { render: renderMock } = mockTurnstile()
    render(<TurnstileWidget onVerify={jest.fn()} onExpire={jest.fn()} onError={jest.fn()} />)

    await waitFor(() => expect(renderMock).toHaveBeenCalledTimes(1))
    expect(renderMock).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ callback: expect.any(Function), 'expired-callback': expect.any(Function), 'error-callback': expect.any(Function) }),
    )
  })

  it('removes the widget on unmount', async () => {
    const { render: renderMock, remove } = mockTurnstile()
    const { unmount } = render(<TurnstileWidget onVerify={jest.fn()} onExpire={jest.fn()} onError={jest.fn()} />)
    await waitFor(() => expect(renderMock).toHaveBeenCalledTimes(1))

    unmount()
    expect(remove).toHaveBeenCalledWith('widget-1')
  })

  it('calls window.turnstile.reset when reset() is invoked via ref', async () => {
    const { render: renderMock, reset } = mockTurnstile()
    const ref = createRef<TurnstileWidgetHandle>()
    render(<TurnstileWidget ref={ref} onVerify={jest.fn()} onExpire={jest.fn()} onError={jest.fn()} />)
    await waitFor(() => expect(renderMock).toHaveBeenCalledTimes(1))

    ref.current?.reset()
    expect(reset).toHaveBeenCalledWith('widget-1')
  })

  it('calls onError when the Turnstile script fails to load', async () => {
    const onError = jest.fn()
    // No window.turnstile and no script in the DOM — the widget's loadTurnstileScript()
    // call will inject a <script> tag; simulate its error event.
    render(<TurnstileWidget onVerify={jest.fn()} onExpire={jest.fn()} onError={onError} />)

    const script = document.head.querySelector('script[src*="turnstile"]')
    expect(script).not.toBeNull()
    script?.dispatchEvent(new Event('error'))

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
  })
})
