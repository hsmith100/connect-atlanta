import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { PublicPhoto } from '@shared/types/store'
import EventPhotosPage from './EventPhotosPage'
import { getPublicCollectionPage } from '../../lib/api/store'
import { ApiError } from '../../lib/api/client'
import { StoreCartProvider } from '../../lib/store/cartContext'

jest.mock('../../lib/api/store')
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))

const photo = (id: string): PublicPhoto => ({
  id, thumbnailUrl: `https://m/thumbs/${id}.jpg`, previewUrl: `https://m/previews/${id}.jpg`, width: 6, height: 4, priceCents: 1500, photographerName: 'Jay',
})
const collection = { id: 'c1', title: 'Beats on the Block', eventDate: '2026-08-15', photoCount: 3 }

function renderPage(collectionId: string | null = 'c1') {
  return render(<StoreCartProvider><EventPhotosPage collectionId={collectionId} /></StoreCartProvider>)
}

beforeEach(() => {
  jest.resetAllMocks()
  window.localStorage.clear()
  ;(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() }))
})

it('loads the collection and shows its photos', async () => {
  jest.mocked(getPublicCollectionPage).mockResolvedValue({ collection, photos: [photo('a'), photo('b')], nextCursor: null })
  renderPage()
  expect(screen.getByLabelText('Loading photos')).toBeInTheDocument()
  expect(await screen.findByRole('heading', { name: 'Beats on the Block' })).toBeInTheDocument()
  expect(screen.getByText(/3 photos for sale/)).toBeInTheDocument()
  expect(screen.getAllByLabelText(/View photo/)).toHaveLength(2)
  expect(screen.getByRole('link', { name: /All event photos/ })).toHaveAttribute('href', '/shop#photos')
})

it('loads the next page and appends it', async () => {
  jest.mocked(getPublicCollectionPage)
    .mockResolvedValueOnce({ collection, photos: [photo('a')], nextCursor: 'cur1' })
    .mockResolvedValueOnce({ collection, photos: [photo('b')], nextCursor: null })
  renderPage()
  fireEvent.click(await screen.findByRole('button', { name: 'Load more photos' }))
  await waitFor(() => expect(screen.getAllByLabelText(/View photo/)).toHaveLength(2))
  expect(getPublicCollectionPage).toHaveBeenLastCalledWith('c1', 'cur1')
})

it('steps onto the next page from the last loaded photo in the viewer', async () => {
  jest.mocked(getPublicCollectionPage)
    .mockResolvedValueOnce({ collection, photos: [photo('a')], nextCursor: 'cur1' })
    .mockResolvedValueOnce({ collection, photos: [photo('b')], nextCursor: null })
  renderPage()
  fireEvent.click(await screen.findByLabelText('View photo 1'))
  fireEvent.click(screen.getByLabelText('Next photo'))
  expect(await screen.findByAltText('Event photo 2, watermarked preview')).toHaveAttribute('src', 'https://m/previews/b.jpg')
})

it('opens and closes the viewer', async () => {
  jest.mocked(getPublicCollectionPage).mockResolvedValue({ collection, photos: [photo('a')], nextCursor: null })
  renderPage()
  fireEvent.click(await screen.findByLabelText('View photo 1'))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.click(screen.getByLabelText('Close'))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it.each([
  ['an unknown or unpublished collection', () => jest.mocked(getPublicCollectionPage).mockRejectedValue(new ApiError('nf', 404, {}))],
])('says the collection is unavailable for %s', async (_label, setup) => {
  setup()
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent("This photo collection isn't available.")
})

it('says the collection is unavailable when no event is given', () => {
  renderPage(null)
  expect(screen.getByRole('alert')).toHaveTextContent("This photo collection isn't available.")
  expect(getPublicCollectionPage).not.toHaveBeenCalled()
})

it('shows a readable error for other failures', async () => {
  jest.mocked(getPublicCollectionPage).mockRejectedValue(new Error('HTTP 500'))
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load these photos")
})
