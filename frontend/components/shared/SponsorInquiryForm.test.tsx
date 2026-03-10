import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SponsorInquiryForm from './SponsorInquiryForm'

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn()
})

function submitForm() {
  fireEvent.submit(screen.getByRole('button', { name: /submit sponsor inquiry/i }).closest('form')!)
}

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText('Your full name'), { target: { name: 'name', value: 'Jane Smith' } })
  fireEvent.change(screen.getByPlaceholderText('Your company name'), { target: { name: 'company', value: 'Acme Corp' } })
  fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { name: 'email', value: 'jane@acme.com' } })
  fireEvent.change(screen.getByPlaceholderText('(555) 123-4567'), { target: { name: 'phone', value: '5550001234' } })
  fireEvent.change(screen.getByPlaceholderText(/describe your product/i), { target: { name: 'productIndustry', value: 'Beverages' } })
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

// ── rendering ─────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders the form heading', () => {
    render(<SponsorInquiryForm />)
    expect(screen.getByRole('heading', { name: /become a sponsor/i })).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    render(<SponsorInquiryForm />)
    expect(screen.getByRole('button', { name: /submit sponsor inquiry/i })).toBeInTheDocument()
  })

  it('does not show success or error banner initially', () => {
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

  it('shows success banner after submit', async () => {
    render(<SponsorInquiryForm />)
    fillRequiredFields()
    submitForm()
    await waitFor(() => expect(screen.getByText(/thank you for your interest/i)).toBeInTheDocument())
  })

  it('clears the form after successful submit', async () => {
    render(<SponsorInquiryForm />)
    fillRequiredFields()
    submitForm()
    await waitFor(() => expect((screen.getByPlaceholderText('your@email.com') as HTMLInputElement).value).toBe(''))
  })

  it('posts to the correct endpoint with correct payload', async () => {
    render(<SponsorInquiryForm />)
    fillRequiredFields()
    submitForm()
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      '/api/forms/sponsor-inquiry',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Smith',
          company: 'Acme Corp',
          email: 'jane@acme.com',
          phone: '5550001234',
          productIndustry: 'Beverages',
        }),
      }),
    ))
  })
})

// ── failed submission ──────────────────────────────────────────────────────────

describe('failed submission', () => {
  it('shows error banner when fetch returns non-ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false })
    render(<SponsorInquiryForm />)
    fillRequiredFields()
    submitForm()
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })

  it('shows error banner when fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<SponsorInquiryForm />)
    fillRequiredFields()
    submitForm()
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })
})

// ── submitting state ───────────────────────────────────────────────────────────

describe('submitting state', () => {
  it('shows "Submitting..." while the request is in flight', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    render(<SponsorInquiryForm />)
    fillRequiredFields()
    submitForm()
    await waitFor(() => expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument())
  })
})
