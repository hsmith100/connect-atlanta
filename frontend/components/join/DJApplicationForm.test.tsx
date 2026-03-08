import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DJApplicationForm from './DJApplicationForm'

jest.mock('../../lib/gtag', () => ({ trackDJApplication: jest.fn() }))

const { trackDJApplication } = jest.requireMock('../../lib/gtag')

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn()
})

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { name: 'email', value: 'dj@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Your full legal name'), { target: { name: 'fullLegalName', value: 'Jane Smith' } })
  fireEvent.change(screen.getByPlaceholderText('Your DJ/Artist name'), { target: { name: 'djName', value: 'DJ Jane' } })
  fireEvent.change(screen.getByPlaceholderText('City name'), { target: { name: 'city', value: 'Atlanta' } })
  fireEvent.change(screen.getByPlaceholderText('(555) 123-4567'), { target: { name: 'phone', value: '5550001234' } })
  fireEvent.change(screen.getByPlaceholderText('https://instagram.com/...'), { target: { name: 'instagramLink', value: 'https://instagram.com/djjane' } })
  // Select rekordbox radio by value since radios have no associated label element
  const radios = screen.getAllByRole('radio')
  const yesRadio = radios.find(r => (r as HTMLInputElement).value === 'Yes')!
  fireEvent.click(yesRadio)
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
})

// ── rendering ─────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders the form heading', () => {
    render(<DJApplicationForm />)
    expect(screen.getByRole('heading', { name: /dj application/i })).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    render(<DJApplicationForm />)
    expect(screen.getByRole('button', { name: /submit dj application/i })).toBeInTheDocument()
  })

  it('does not show success or error banner initially', () => {
    render(<DJApplicationForm />)
    expect(screen.queryByText(/thank you for your application/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
  })
})

// ── successful submission ──────────────────────────────────────────────────────

describe('successful submission', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true })
  })

  it('shows success banner after submit', async () => {
    render(<DJApplicationForm />)
    fillRequiredFields()
    fireEvent.submit(screen.getByRole('button', { name: /submit dj application/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/thank you for your application/i)).toBeInTheDocument())
  })

  it('clears the email field after successful submit', async () => {
    render(<DJApplicationForm />)
    fillRequiredFields()
    fireEvent.submit(screen.getByRole('button', { name: /submit dj application/i }).closest('form')!)
    await waitFor(() => expect((screen.getByPlaceholderText('your@email.com') as HTMLInputElement).value).toBe(''))
  })

  it('fires the gtag DJ application event', async () => {
    render(<DJApplicationForm />)
    fillRequiredFields()
    fireEvent.submit(screen.getByRole('button', { name: /submit dj application/i }).closest('form')!)
    await waitFor(() => expect(trackDJApplication).toHaveBeenCalledTimes(1))
  })
})

// ── failed submission ──────────────────────────────────────────────────────────

describe('failed submission', () => {
  it('shows error banner when fetch returns non-ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    render(<DJApplicationForm />)
    fillRequiredFields()
    fireEvent.submit(screen.getByRole('button', { name: /submit dj application/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })

  it('shows error banner when fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<DJApplicationForm />)
    fillRequiredFields()
    fireEvent.submit(screen.getByRole('button', { name: /submit dj application/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })
})

// ── submitting state ───────────────────────────────────────────────────────────

describe('submitting state', () => {
  it('shows "Submitting..." while the request is in flight', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    render(<DJApplicationForm />)
    fillRequiredFields()
    fireEvent.submit(screen.getByRole('button', { name: /submit dj application/i }).closest('form')!)
    await waitFor(() => expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument())
  })
})
