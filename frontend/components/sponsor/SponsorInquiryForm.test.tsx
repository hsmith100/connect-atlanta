import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SponsorInquiryForm from './SponsorInquiryForm'

jest.mock('../../lib/gtag', () => ({ trackFormSubmission: jest.fn() }))

const { trackFormSubmission } = jest.requireMock('../../lib/gtag')

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
  fireEvent.change(screen.getByPlaceholderText('Your full name'), { target: { name: 'name', value: 'Acme Corp' } })
  fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { name: 'email', value: 'sponsor@acme.com' } })
  fireEvent.change(screen.getByPlaceholderText('(555) 123-4567'), { target: { name: 'phone', value: '5550001234' } })
  fireEvent.change(screen.getByPlaceholderText('Your company name'), { target: { name: 'company', value: 'Acme Corp' } })
  fireEvent.change(screen.getByPlaceholderText('Tell us about your product or industry...'), { target: { name: 'productIndustry', value: 'Beverages' } })
}

// ── rendering ─────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders the section heading', () => {
    render(<SponsorInquiryForm />)
    expect(screen.getByRole('heading', { name: /let's work together/i })).toBeInTheDocument()
  })

  it('does not show status banners initially', () => {
    render(<SponsorInquiryForm />)
    expect(screen.queryByText(/thank you for your interest/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
  })
})

// ── successful submission ──────────────────────────────────────────────────────

describe('successful submission', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true })
  })

  it('shows success banner', async () => {
    render(<SponsorInquiryForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /submit inquiry/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/thank you for your interest/i)).toBeInTheDocument())
  })

  it('clears the form after submit', async () => {
    render(<SponsorInquiryForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /submit inquiry/i }).closest('form')!)
    await waitFor(() => expect((screen.getByPlaceholderText('Your full name') as HTMLInputElement).value).toBe(''))
  })

  it('fires gtag sponsor inquiry event', async () => {
    render(<SponsorInquiryForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /submit inquiry/i }).closest('form')!)
    await waitFor(() => expect(trackFormSubmission).toHaveBeenCalledWith('Sponsor Inquiry'))
  })
})

// ── failed submission ──────────────────────────────────────────────────────────

describe('failed submission', () => {
  it('shows error banner when fetch returns non-ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    render(<SponsorInquiryForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /submit inquiry/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })

  it('shows error banner when fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<SponsorInquiryForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /submit inquiry/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })
})

// ── submitting state ───────────────────────────────────────────────────────────

describe('submitting state', () => {
  it('shows Submitting... while request is in flight', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    render(<SponsorInquiryForm />)
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: /submit inquiry/i }).closest('form')!)
    await waitFor(() => expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument())
  })
})
