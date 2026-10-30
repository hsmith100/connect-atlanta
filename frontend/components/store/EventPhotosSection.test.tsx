import React from 'react'
import { render, screen } from '@testing-library/react'
import EventPhotosSection from './EventPhotosSection'
import { getPublicCollections } from '../../lib/api/store'

jest.mock('../../lib/api/store')
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))

const collection = {
  id: 'c1', eventId: 'e1', title: 'Beats on the Block', eventDate: '2026-08-15',
  coverThumbnailUrl: 'https://m/library/thumbs/x.jpg', photoCount: 412, photographerNames: ['Jay Ortiz', 'Maria'],
}

beforeEach(() => jest.resetAllMocks())

it('shows a card per collection linking to its photos', async () => {
  jest.mocked(getPublicCollections).mockResolvedValue([collection])
  render(<EventPhotosSection />)
  const link = await screen.findByRole('link', { name: /Beats on the Block/ })
  expect(link).toHaveAttribute('href', '/shop/photos?event=c1')
  expect(screen.getByText(/412 photos/)).toBeInTheDocument()
  expect(screen.getByText('Photos by Jay Ortiz, Maria')).toBeInTheDocument()
  expect(screen.getByAltText('Photos from Beats on the Block')).toHaveAttribute('src', 'https://m/library/thumbs/x.jpg')
})

it('has the #photos anchor and the lost-download-link link', async () => {
  jest.mocked(getPublicCollections).mockResolvedValue([])
  const { container } = render(<EventPhotosSection />)
  expect(container.querySelector('section#photos')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Lost your download link?' })).toHaveAttribute('href', '/shop/download')
})

it('shows a loading state, then an empty state', async () => {
  jest.mocked(getPublicCollections).mockResolvedValue([])
  render(<EventPhotosSection />)
  expect(screen.getByLabelText('Loading event photos')).toBeInTheDocument()
  expect(await screen.findByText('No event photos are on sale right now.')).toBeInTheDocument()
})

it('shows a readable error', async () => {
  jest.mocked(getPublicCollections).mockRejectedValue(new Error('HTTP 500'))
  render(<EventPhotosSection />)
  expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load event photos right now")
})
