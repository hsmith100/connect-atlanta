import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SponsorsSection } from './SponsorsSection'
import type { Submission } from './shared'

jest.mock('../../../lib/api/adminSubmissions', () => ({
  updateSponsorNotes: jest.fn().mockResolvedValue({}),
}))

const { updateSponsorNotes } = require('../../../lib/api/adminSubmissions')

const makeSubmission = (id: string, overrides?: Partial<Submission>): Submission => ({
  id,
  name: `Sponsor ${id}`,
  company: `Company ${id}`,
  email: `${id}@example.com`,
  phone: '404-555-0000',
  productIndustry: 'Music',
  notes: '',
  createdAt: new Date().toISOString(),
  ...overrides,
})

afterEach(() => jest.clearAllMocks())

it('shows empty state when no submissions', () => {
  render(<SponsorsSection sponsors={[]} adminKey="key" />)
  expect(screen.getByText('No submissions in this period.')).toBeInTheDocument()
})

it('renders submission count in the heading', () => {
  const sponsors = [makeSubmission('1'), makeSubmission('2')]
  render(<SponsorsSection sponsors={sponsors} adminKey="key" />)
  expect(screen.getByText(/Sponsor Inquiries \(2\)/)).toBeInTheDocument()
})

it('renders sponsor name and company', () => {
  render(<SponsorsSection sponsors={[makeSubmission('1')]} adminKey="key" />)
  expect(screen.getByText(/Sponsor 1/)).toBeInTheDocument()
  expect(screen.getByText(/Company 1/)).toBeInTheDocument()
})

it('renders sponsor email', () => {
  render(<SponsorsSection sponsors={[makeSubmission('1')]} adminKey="key" />)
  expect(screen.getByText(/1@example.com/)).toBeInTheDocument()
})

it('renders the notes textarea with existing notes', () => {
  render(<SponsorsSection sponsors={[makeSubmission('1', { notes: 'Great lead' })]} adminKey="key" />)
  expect(screen.getByDisplayValue('Great lead')).toBeInTheDocument()
})

it('updates notes state when textarea changes', () => {
  render(<SponsorsSection sponsors={[makeSubmission('1')]} adminKey="key" />)
  const textarea = screen.getByPlaceholderText(/Notes/)
  fireEvent.change(textarea, { target: { value: 'New note' } })
  expect((textarea as HTMLTextAreaElement).value).toBe('New note')
})

it('calls updateSponsorNotes on textarea blur', async () => {
  render(<SponsorsSection sponsors={[makeSubmission('1')]} adminKey="my-key" />)
  const textarea = screen.getByPlaceholderText(/Notes/)
  fireEvent.change(textarea, { target: { value: 'Autosave me' } })
  fireEvent.blur(textarea)
  await waitFor(() => expect(updateSponsorNotes).toHaveBeenCalledWith('my-key', '1', 'Autosave me'))
})

it('renders the date filter dropdown', () => {
  render(<SponsorsSection sponsors={[]} adminKey="key" />)
  expect(screen.getByRole('combobox')).toBeInTheDocument()
})

it('filters submissions by date when filter changes', () => {
  const old: Submission = makeSubmission('old', {
    createdAt: new Date('2020-01-01').toISOString(),
  })
  const recent: Submission = makeSubmission('recent', {
    createdAt: new Date().toISOString(),
  })
  render(<SponsorsSection sponsors={[old, recent]} adminKey="key" />)
  // Start with all (count = 2)
  expect(screen.getByText(/Sponsor Inquiries \(2\)/)).toBeInTheDocument()
  // Filter to last 7 days — only 'recent' matches
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '7' } })
  expect(screen.getByText(/Sponsor Inquiries \(1\)/)).toBeInTheDocument()
})
