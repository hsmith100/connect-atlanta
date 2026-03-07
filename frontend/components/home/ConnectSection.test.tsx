import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConnectSection from './ConnectSection'

window.HTMLElement.prototype.scrollIntoView = jest.fn()

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.restoreAllMocks()
})

// ── renders ───────────────────────────────────────────────────────────────────

describe('renders', () => {
  it('shows all form fields', () => {
    render(<ConnectSection />)
    expect(screen.getByLabelText(/name \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connect with us/i })).toBeInTheDocument()
  })
})

// ── form submission ───────────────────────────────────────────────────────────

describe('form submission', () => {
  async function fillAndSubmit() {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) })
    render(<ConnectSection />)
    await user.type(screen.getByLabelText(/name \*/i), 'Alice')
    await user.type(screen.getByLabelText(/email \*/i), 'alice@example.com')
    await user.type(screen.getByLabelText(/phone number/i), '5551234567')
    await user.click(screen.getByRole('button', { name: /connect with us/i }))
    return user
  }

  it('sends the correct payload to the API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    await fillAndSubmit()
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/forms/email-signup',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"Alice"'),
        }),
      ),
    )
    jest.useRealTimers()
  })

  it('includes source: website in the payload', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    await fillAndSubmit()
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: expect.stringContaining('"source":"website"') }),
      ),
    )
    jest.useRealTimers()
  })

  it('shows success message after successful submit', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    await fillAndSubmit()
    await waitFor(() => expect(screen.getByText(/thank you for signing up/i)).toBeInTheDocument())
    jest.useRealTimers()
  })

  it('shows error message when the request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'fail' }) })
    jest.spyOn(console, 'error').mockImplementation(() => {})
    await fillAndSubmit()
    await waitFor(() => expect(screen.getByText(/oops/i)).toBeInTheDocument())
    jest.useRealTimers()
  })

  it('shows error message when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    jest.spyOn(console, 'error').mockImplementation(() => {})
    await fillAndSubmit()
    await waitFor(() => expect(screen.getByText(/oops/i)).toBeInTheDocument())
    jest.useRealTimers()
  })
})
