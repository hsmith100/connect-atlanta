import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmailSignupsSection } from './EmailSignupsSection'
import type { Submission } from './shared'

const makeSignup = (id: string, overrides?: Partial<Submission>): Submission => ({
  id,
  name: `User ${id}`,
  email: `${id}@example.com`,
  phone: '',
  source: 'website',
  subject: null,
  message: null,
  createdAt: new Date().toISOString(),
  ...overrides,
})

it('shows empty state when no signups', () => {
  render(<EmailSignupsSection signups={[]} />)
  expect(screen.getByText('No signups in this period.')).toBeInTheDocument()
})

it('renders count in the heading', () => {
  render(<EmailSignupsSection signups={[makeSignup('1'), makeSignup('2')]} />)
  expect(screen.getByText(/Contacts & Signups \(2\)/)).toBeInTheDocument()
})

it('renders signup name and email', () => {
  render(<EmailSignupsSection signups={[makeSignup('1')]} />)
  expect(screen.getByText('User 1')).toBeInTheDocument()
  expect(screen.getByText('1@example.com')).toBeInTheDocument()
})

it('renders the source column', () => {
  render(<EmailSignupsSection signups={[makeSignup('1', { source: 'contact-form' })]} />)
  expect(screen.getByText('contact-form')).toBeInTheDocument()
})

it('renders subject and message when present', () => {
  render(<EmailSignupsSection signups={[makeSignup('1', { subject: 'Inquiry', message: 'Hello there' })]} />)
  expect(screen.getByText('Inquiry')).toBeInTheDocument()
  expect(screen.getByText('Hello there')).toBeInTheDocument()
})

it('filters submissions by date when filter changes', () => {
  const old: Submission = makeSignup('old', { createdAt: new Date('2020-01-01').toISOString() })
  const recent: Submission = makeSignup('recent', { createdAt: new Date().toISOString() })
  render(<EmailSignupsSection signups={[old, recent]} />)
  expect(screen.getByText(/Contacts & Signups \(2\)/)).toBeInTheDocument()
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '7' } })
  expect(screen.getByText(/Contacts & Signups \(1\)/)).toBeInTheDocument()
})
