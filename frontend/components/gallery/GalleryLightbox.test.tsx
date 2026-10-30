import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GalleryLightbox from './GalleryLightbox'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))
import type { Photo } from '@shared/types/photos'

function makePhoto(id: string): Photo {
  return { id, url: `https://cdn.example.com/photos/${id}.jpg` } as Photo
}

const photos = [makePhoto('a'), makePhoto('b'), makePhoto('c')]

function renderLightbox(selectedIndex = 0, overrides: Partial<React.ComponentProps<typeof GalleryLightbox>> = {}) {
  const props = {
    photos,
    selectedIndex,
    onClose: jest.fn(),
    onNext: jest.fn(),
    onPrev: jest.fn(),
    ...overrides,
  }
  render(<GalleryLightbox {...props} />)
  return props
}

// ── rendering ─────────────────────────────────────────────────────────────────

it('renders the selected image', () => {
  renderLightbox(1)
  const img = screen.getByRole('img') as HTMLImageElement
  expect(img.src).toContain('b.jpg')
})

it('shows the correct counter', () => {
  renderLightbox(1)
  expect(screen.getByText('2 / 3')).toBeInTheDocument()
})

it('hides prev/next buttons when there is only one photo', () => {
  render(<GalleryLightbox photos={[makePhoto('solo')]} selectedIndex={0} onClose={jest.fn()} onNext={jest.fn()} onPrev={jest.fn()} />)
  expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
})

// ── button interactions ────────────────────────────────────────────────────────

it('calls onClose when the close button is clicked', () => {
  const { onClose } = renderLightbox()
  fireEvent.click(screen.getByRole('button', { name: /close modal/i }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('calls onNext when the next button is clicked', () => {
  const { onNext } = renderLightbox()
  fireEvent.click(screen.getByRole('button', { name: /next image/i }))
  expect(onNext).toHaveBeenCalledTimes(1)
})

it('calls onPrev when the previous button is clicked', () => {
  const { onPrev } = renderLightbox()
  fireEvent.click(screen.getByRole('button', { name: /previous image/i }))
  expect(onPrev).toHaveBeenCalledTimes(1)
})

it('calls onClose when the backdrop is clicked', () => {
  const { onClose } = renderLightbox()
  // The outermost div is the backdrop
  fireEvent.click(screen.getByRole('img').closest('.fixed')!)
  expect(onClose).toHaveBeenCalled()
})

// ── keyboard navigation ────────────────────────────────────────────────────────

it('calls onClose on Escape key', () => {
  const { onClose } = renderLightbox()
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('calls onNext on ArrowRight key', () => {
  const { onNext } = renderLightbox()
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(onNext).toHaveBeenCalledTimes(1)
})

it('calls onPrev on ArrowLeft key', () => {
  const { onPrev } = renderLightbox()
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  expect(onPrev).toHaveBeenCalledTimes(1)
})

// ── buy link ──────────────────────────────────────────────────────────────────

describe('buy photos link', () => {
  const withEvents = [{ ...makePhoto('a'), eventId: 'e1' }, { ...makePhoto('b'), eventId: 'e2' }] as Photo[]

  it("links to the event photos page when the photo's event has photos for sale", () => {
    renderLightbox(0, { photos: withEvents, collectionByEvent: { e1: 'c1' } })
    expect(screen.getByRole('link', { name: /Buy photos from this event/ })).toHaveAttribute('href', '/shop/photos?event=c1')
  })

  it('is hidden when the event has nothing for sale', () => {
    renderLightbox(1, { photos: withEvents, collectionByEvent: { e1: 'c1' } })
    expect(screen.queryByRole('link', { name: /Buy photos/ })).not.toBeInTheDocument()
  })

  it('is hidden for photos without an event', () => {
    renderLightbox(0, { collectionByEvent: { e1: 'c1' } })
    expect(screen.queryByRole('link', { name: /Buy photos/ })).not.toBeInTheDocument()
  })
})
