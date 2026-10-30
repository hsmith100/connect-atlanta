import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { PublicPhoto } from '@shared/types/store'
import PhotoDetailModal from './PhotoDetailModal'
import { StoreCartProvider } from '../../lib/store/cartContext'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))

const photo = (id: string, extra: Partial<PublicPhoto> = {}): PublicPhoto => ({
  id, thumbnailUrl: `https://m/thumbs/${id}.jpg`, previewUrl: `https://m/previews/${id}.jpg`, width: 6, height: 4, priceCents: 1500, photographerName: 'Jay Ortiz', ...extra,
})
const photos = [photo('a'), photo('b', { priceCents: 2500 }), photo('c')]

function renderModal(props: Partial<React.ComponentProps<typeof PhotoDetailModal>> = {}) {
  const handlers = { onClose: jest.fn(), onNext: jest.fn(), onPrev: jest.fn() }
  render(
    <StoreCartProvider>
      <PhotoDetailModal photos={photos} index={1} collectionId="c1" hasMore={false} {...handlers} {...props} />
    </StoreCartProvider>,
  )
  return handlers
}

beforeEach(() => window.localStorage.clear())

it('shows the watermarked preview, price, credit and position', () => {
  renderModal()
  expect(screen.getByAltText('Event photo 2, watermarked preview')).toHaveAttribute('src', 'https://m/previews/b.jpg')
  expect(screen.getByText('$25.00')).toBeInTheDocument()
  expect(screen.getByText('Photo by Jay Ortiz')).toBeInTheDocument()
  expect(screen.getByText('2 / 3')).toBeInTheDocument()
})

it('adds to and removes from the cart', () => {
  renderModal()
  fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
  expect(JSON.parse(window.localStorage.getItem('bob_photo_cart')!)).toEqual([{ photoId: 'b', collectionId: 'c1', thumbnailUrl: 'https://m/thumbs/b.jpg' }])
  expect(screen.getByRole('link', { name: 'View cart (1)' })).toHaveAttribute('href', '/shop/cart')
  fireEvent.click(screen.getByRole('button', { name: 'In cart — remove' }))
  expect(JSON.parse(window.localStorage.getItem('bob_photo_cart')!)).toEqual([])
})

it('navigates with buttons and arrow keys, and closes with Escape', () => {
  const { onNext, onPrev, onClose } = renderModal()
  fireEvent.click(screen.getByLabelText('Next photo'))
  fireEvent.click(screen.getByLabelText('Previous photo'))
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onNext).toHaveBeenCalledTimes(2)
  expect(onPrev).toHaveBeenCalledTimes(2)
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('hides Previous on the first photo and Next on the last when nothing more can load', () => {
  renderModal({ index: 0 })
  expect(screen.queryByLabelText('Previous photo')).not.toBeInTheDocument()
})

it('offers Next on the last loaded photo when more pages exist', () => {
  renderModal({ index: 2, hasMore: true })
  expect(screen.getByLabelText('Next photo')).toBeInTheDocument()
  expect(screen.getByText('3 / 3+')).toBeInTheDocument()
})

it('locks background scroll while open', () => {
  renderModal()
  expect(document.body.style.overflow).toBe('hidden')
})
