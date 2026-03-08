import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SponsorDeckSlider from './SponsorDeckSlider'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

const images = ['/img/1.webp', '/img/2.webp', '/img/3.webp']

function renderSlider(onOpenModal = jest.fn()) {
  return { onOpenModal, ...render(<SponsorDeckSlider images={images} onOpenModal={onOpenModal} />) }
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

// ── rendering ─────────────────────────────────────────────────────────────────

it('shows page counter starting at 1', () => {
  renderSlider()
  expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
})

// ── navigation ────────────────────────────────────────────────────────────────

it('advances to the next slide when next button is clicked', () => {
  renderSlider()
  fireEvent.click(screen.getByRole('button', { name: /next slide/i }))
  expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
})

it('goes to the previous slide when previous button is clicked', () => {
  renderSlider()
  fireEvent.click(screen.getByRole('button', { name: /next slide/i }))
  fireEvent.click(screen.getByRole('button', { name: /previous slide/i }))
  expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
})

it('jumps to the correct slide when a dot is clicked', () => {
  renderSlider()
  fireEvent.click(screen.getByRole('button', { name: /go to slide 3/i }))
  expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
})

// ── auto-advance ───────────────────────────────────────────────────────────────

it('auto-advances every 4 seconds', () => {
  renderSlider()
  act(() => jest.advanceTimersByTime(4000))
  expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
  act(() => jest.advanceTimersByTime(4000))
  expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
})

// ── modal ──────────────────────────────────────────────────────────────────────

it('calls onOpenModal with the current slide index when image is clicked', () => {
  const { onOpenModal } = renderSlider()
  // advance to slide 2
  fireEvent.click(screen.getByRole('button', { name: /next slide/i }))
  // click the visible slide container (first visible div with cursor-pointer)
  const slides = document.querySelectorAll('.cursor-pointer')
  fireEvent.click(slides[1]) // index 1
  expect(onOpenModal).toHaveBeenCalledWith(1)
})
