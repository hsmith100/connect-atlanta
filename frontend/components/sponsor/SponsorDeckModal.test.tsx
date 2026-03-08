import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SponsorDeckModal from './SponsorDeckModal'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

const images = ['/img/1.webp', '/img/2.webp', '/img/3.webp']

function renderModal(initialIndex = 0, onClose = jest.fn()) {
  render(<SponsorDeckModal images={images} initialIndex={initialIndex} onClose={onClose} />)
  return { onClose }
}

// ── rendering ─────────────────────────────────────────────────────────────────

it('renders the image at initialIndex', () => {
  renderModal(1)
  const imgs = screen.getAllByRole('img')
  expect(imgs.some(img => (img as HTMLImageElement).src.includes('2.webp'))).toBe(true)
})

it('shows the correct counter', () => {
  renderModal(1)
  expect(screen.getByText('2 / 3')).toBeInTheDocument()
})

// ── button interactions ────────────────────────────────────────────────────────

it('calls onClose when the close button is clicked', () => {
  const { onClose } = renderModal()
  fireEvent.click(screen.getByRole('button', { name: /close gallery/i }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('advances to the next image when next is clicked', () => {
  renderModal(0)
  fireEvent.click(screen.getByRole('button', { name: /next image/i }))
  expect(screen.getByText('2 / 3')).toBeInTheDocument()
})

it('goes to the previous image when prev is clicked', () => {
  renderModal(1)
  fireEvent.click(screen.getByRole('button', { name: /previous image/i }))
  expect(screen.getByText('1 / 3')).toBeInTheDocument()
})

it('jumps to a slide when a thumbnail is clicked', () => {
  renderModal(0)
  fireEvent.click(screen.getByRole('button', { name: /go to page 3/i }))
  expect(screen.getByText('3 / 3')).toBeInTheDocument()
})

// ── keyboard navigation ────────────────────────────────────────────────────────

it('calls onClose on Escape key', () => {
  const { onClose } = renderModal()
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('advances on ArrowRight key', () => {
  renderModal(0)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByText('2 / 3')).toBeInTheDocument()
})

it('goes back on ArrowLeft key', () => {
  renderModal(1)
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  expect(screen.getByText('1 / 3')).toBeInTheDocument()
})
