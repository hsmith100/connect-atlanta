import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContactForm from './ContactForm'

jest.mock('../../lib/gtag', () => ({ trackContactForm: jest.fn() }))

const { trackContactForm } = jest.requireMock('../../lib/gtag')

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
  fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { name: 'name', value: 'Jane' } })
  fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { name: 'email', value: 'jane@example.com' } })
  fireEvent.change(screen.getByPlaceholderText("What's this about?"), { target: { name: 'subject', value: 'Hello' } })
  fireEvent.change(screen.getByPlaceholderText("Tell us what's on your mind..."), { target: { name: 'message', value: 'Hi there!' } })
}

// ── rendering ─────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders the heading', () => {
    render(<ContactForm />)
    expect(screen.getByRole('heading', { name: /send us a message/i })).toBeInTheDocument()
  })

  it('does not show status banners initially', () => {
    render(<ContactForm />)
    expect(screen.queryByText(/message sent/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
  })
})

// ── successful submission ──────────────────────────────────────────────────────

describe('successful submission', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true })
  })

  it('shows success banner', async () => {
    render(<ContactForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument())
  })

  it('fires gtag contact form event', async () => {
    render(<ContactForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!)
    await waitFor(() => expect(trackContactForm).toHaveBeenCalledTimes(1))
  })
})

// ── failed submission ──────────────────────────────────────────────────────────

describe('failed submission', () => {
  it('shows error banner when fetch returns non-ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    render(<ContactForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })

  it('shows error banner when fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<ContactForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })
})

// ── submitting state ───────────────────────────────────────────────────────────

describe('submitting state', () => {
  it('shows SENDING... while request is in flight', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    render(<ContactForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!)
    await waitFor(() => expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument())
  })
})
