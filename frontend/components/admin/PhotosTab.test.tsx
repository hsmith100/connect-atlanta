import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PhotosTab } from './PhotosTab'
import type { Photo } from '@shared/types/photos'
import type { Event } from '@shared/types/events'

jest.mock('../../lib/api', () => ({
  getAdminPhotos: jest.fn(),
  presignPhotos: jest.fn(),
  createPhotos: jest.fn(),
  updatePhotos: jest.fn().mockResolvedValue({}),
  deletePhotos: jest.fn().mockResolvedValue({}),
}))
jest.mock('../../lib/generateThumbnail', () => ({
  generateThumbnail: jest.fn().mockResolvedValue(new Blob()),
}))

window.confirm = jest.fn(() => true)

const { updatePhotos, deletePhotos } = require('../../lib/api')

const makePhoto = (id: string, overrides?: Partial<Photo>): Photo => ({
  id,
  entity: 'PHOTO',
  url: `https://example.com/${id}.jpg`,
  thumbnailUrl: `https://example.com/${id}-thumb.jpg`,
  eventId: null,
  sortOrder: 10,
  visible: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const EVENT: Event = {
  id: 'ev-1',
  entity: 'EVENT',
  title: 'Summer Fest',
  date: '2026-06-15',
  startTime: '18:00',
  endTime: '22:00',
  location: 'Park',
  flyerUrl: null,
  ticketingUrl: null,
  goLiveAt: null,
  description: null,
  buttonText: null,
}

const setPhotos = jest.fn()

afterEach(() => jest.clearAllMocks())

// ── empty state ────────────────────────────────────────────────────────────────

it('shows empty state when no photos', () => {
  render(<PhotosTab adminKey="key" photos={[]} events={[]} setPhotos={setPhotos} />)
  expect(screen.getByText('No photos yet.')).toBeInTheDocument()
})

// ── photo grid ─────────────────────────────────────────────────────────────────

it('renders photo thumbnails', () => {
  const photos = [makePhoto('p1'), makePhoto('p2')]
  const { container } = render(<PhotosTab adminKey="key" photos={photos} events={[]} setPhotos={setPhotos} />)
  // alt="" gives these presentation role — query directly
  expect(container.querySelectorAll('img')).toHaveLength(2)
})

// ── event filter ───────────────────────────────────────────────────────────────

it('renders event options in the filter dropdown', () => {
  render(<PhotosTab adminKey="key" photos={[]} events={[EVENT]} setPhotos={setPhotos} />)
  expect(screen.getAllByRole('option', { name: 'Summer Fest' })).toHaveLength(2) // filter + upload selects
})

it('filters photos by event', () => {
  const photos = [
    makePhoto('p1', { eventId: 'ev-1' }),
    makePhoto('p2', { eventId: null }),
  ]
  const { container } = render(<PhotosTab adminKey="key" photos={photos} events={[EVENT]} setPhotos={setPhotos} />)
  // All photos shown initially
  expect(container.querySelectorAll('img')).toHaveLength(2)
  // Filter to ev-1 — only p1 should show
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'ev-1' } })
  expect(container.querySelectorAll('img')).toHaveLength(1)
})

// ── selection & delete ─────────────────────────────────────────────────────────

it('shows delete button when photos are selected', () => {
  const photos = [makePhoto('p1')]
  render(<PhotosTab adminKey="key" photos={photos} events={[]} setPhotos={setPhotos} />)
  expect(screen.queryByText(/Delete \(/)).not.toBeInTheDocument()
  // Select the photo via checkbox
  fireEvent.click(screen.getByRole('checkbox'))
  expect(screen.getByText(/Delete \(1\)/)).toBeInTheDocument()
})

it('calls deletePhotos and updates state after confirming delete', async () => {
  const photos = [makePhoto('p1')]
  render(<PhotosTab adminKey="my-key" photos={photos} events={[]} setPhotos={setPhotos} />)
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByText(/Delete \(1\)/))
  await waitFor(() => expect(deletePhotos).toHaveBeenCalledWith('my-key', ['p1']))
  expect(setPhotos).toHaveBeenCalled()
})

// ── toggle visibility ──────────────────────────────────────────────────────────

it('calls updatePhotos when visibility is toggled', async () => {
  const photos = [makePhoto('p1', { visible: true })]
  render(<PhotosTab adminKey="my-key" photos={photos} events={[]} setPhotos={setPhotos} />)
  fireEvent.click(screen.getByTitle('Hide photo'))
  await waitFor(() => expect(updatePhotos).toHaveBeenCalledWith('my-key', [{ id: 'p1', visible: false }]))
})

// ── save order ─────────────────────────────────────────────────────────────────

it('calls updatePhotos with new sort orders when Save order is clicked', async () => {
  const photos = [makePhoto('p1'), makePhoto('p2')]
  render(<PhotosTab adminKey="my-key" photos={photos} events={[]} setPhotos={setPhotos} />)
  fireEvent.click(screen.getByText('Save order'))
  await waitFor(() => expect(updatePhotos).toHaveBeenCalledWith(
    'my-key',
    [{ id: 'p1', sortOrder: 0 }, { id: 'p2', sortOrder: 10 }]
  ))
})
