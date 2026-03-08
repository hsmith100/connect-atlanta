import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EmailSignupForm from './EmailSignupForm'

jest.mock('../../lib/gtag', () => ({ trackEmailSignup: jest.fn() }))

const { trackEmailSignup } = jest.requireMock('../../lib/gtag')

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn()
})

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

function fillForm() {
  fireEvent.change(screen.getByPlaceholderText('Your full name'), { target: { name: 'name', value: 'Jane' } })
  fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), { target: { name: 'email', value: 'jane@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('(555) 123-4567'), { target: { name: 'phone', value: '5550001234' } })
}

// ── rendering ─────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders the heading', () => {
    render(<EmailSignupForm />)
    expect(screen.getByRole('heading', { name: /stay connected/i })).toBeInTheDocument()
  })

  it('does not show status banners initially', () => {
    render(<EmailSignupForm />)
    expect(screen.queryByText(/thank you for signing up/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
  })
})

// ── successful submission ──────────────────────────────────────────────────────

describe('successful submission', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true })
  })

  it('shows success banner', async () => {
    render(<EmailSignupForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /sign up for updates/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/thank you for signing up/i)).toBeInTheDocument())
  })

  it('fires gtag email signup event', async () => {
    render(<EmailSignupForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /sign up for updates/i }).closest('form')!)
    await waitFor(() => expect(trackEmailSignup).toHaveBeenCalledTimes(1))
  })

  it('clears the name field after the success delay', async () => {
    jest.useFakeTimers()
    render(<EmailSignupForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /sign up for updates/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/thank you for signing up/i)).toBeInTheDocument())
    jest.runAllTimers()
    await waitFor(() => expect((screen.getByPlaceholderText('Your full name') as HTMLInputElement).value).toBe(''))
    jest.useRealTimers()
  })
})

// ── failed submission ──────────────────────────────────────────────────────────

describe('failed submission', () => {
  it('shows error banner when fetch returns non-ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    render(<EmailSignupForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /sign up for updates/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })

  it('shows error banner when fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<EmailSignupForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /sign up for updates/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })
})

// ── submitting state ───────────────────────────────────────────────────────────

describe('submitting state', () => {
  it('shows SIGNING UP... while request is in flight', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    render(<EmailSignupForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /sign up for updates/i }).closest('form')!)
    await waitFor(() => expect(screen.getByRole('button', { name: /signing up/i })).toBeInTheDocument())
  })
})
