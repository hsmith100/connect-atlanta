import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import FlyerModal from './FlyerModal'
import type { Event } from '@shared/types/events'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}))

const makeEvent = (id: string, title: string): Event => ({
  id,
  entity: 'EVENT',
  title,
  date: '2026-06-15',
  startTime: '18:00',
  endTime: '22:00',
  location: 'Atlanta Beltline',
  flyerUrl: `https://example.com/${id}.jpg`,
  ticketingUrl: null,
  goLiveAt: null,
  description: null,
  buttonText: null,
})

const EVENTS = [makeEvent('ev-1', 'Event One'), makeEvent('ev-2', 'Event Two'), makeEvent('ev-3', 'Event Three')]

const noop = jest.fn()

afterEach(() => jest.clearAllMocks())

// ── closed state ───────────────────────────────────────────────────────────────

it('renders nothing when selectedIndex is null', () => {
  const { container } = render(
    <FlyerModal events={EVENTS} selectedIndex={null} onClose={noop} onPrev={noop} onNext={noop} />
  )
  expect(container).toBeEmptyDOMElement()
})

// ── open state ─────────────────────────────────────────────────────────────────

it('renders the selected event flyer', () => {
  render(<FlyerModal events={EVENTS} selectedIndex={1} onClose={noop} onPrev={noop} onNext={noop} />)
  expect(screen.getByAltText('Event Two')).toBeInTheDocument()
})

it('shows a counter for multiple events', () => {
  render(<FlyerModal events={EVENTS} selectedIndex={0} onClose={noop} onPrev={noop} onNext={noop} />)
  expect(screen.getByText('1 / 3')).toBeInTheDocument()
})

it('hides prev/next buttons for a single event', () => {
  render(<FlyerModal events={[EVENTS[0]]} selectedIndex={0} onClose={noop} onPrev={noop} onNext={noop} />)
  expect(screen.queryByLabelText('Previous flyer')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Next flyer')).not.toBeInTheDocument()
})

// ── interactions ───────────────────────────────────────────────────────────────

it('calls onClose when the close button is clicked', () => {
  const onClose = jest.fn()
  render(<FlyerModal events={EVENTS} selectedIndex={0} onClose={onClose} onPrev={noop} onNext={noop} />)
  fireEvent.click(screen.getByLabelText('Close'))
  // The button click fires onClose directly; it also bubbles to the backdrop which calls it again
  expect(onClose).toHaveBeenCalled()
})

it('calls onPrev when the previous button is clicked', () => {
  const onPrev = jest.fn()
  render(<FlyerModal events={EVENTS} selectedIndex={1} onClose={noop} onPrev={onPrev} onNext={noop} />)
  fireEvent.click(screen.getByLabelText('Previous flyer'))
  expect(onPrev).toHaveBeenCalledTimes(1)
})

it('calls onNext when the next button is clicked', () => {
  const onNext = jest.fn()
  render(<FlyerModal events={EVENTS} selectedIndex={0} onClose={noop} onPrev={noop} onNext={onNext} />)
  fireEvent.click(screen.getByLabelText('Next flyer'))
  expect(onNext).toHaveBeenCalledTimes(1)
})

// ── keyboard navigation ────────────────────────────────────────────────────────

it('calls onClose on Escape key', () => {
  const onClose = jest.fn()
  render(<FlyerModal events={EVENTS} selectedIndex={0} onClose={onClose} onPrev={noop} onNext={noop} />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('calls onNext on ArrowRight key', () => {
  const onNext = jest.fn()
  render(<FlyerModal events={EVENTS} selectedIndex={0} onClose={noop} onPrev={noop} onNext={onNext} />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(onNext).toHaveBeenCalledTimes(1)
})

it('calls onPrev on ArrowLeft key', () => {
  const onPrev = jest.fn()
  render(<FlyerModal events={EVENTS} selectedIndex={0} onClose={noop} onPrev={onPrev} onNext={noop} />)
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  expect(onPrev).toHaveBeenCalledTimes(1)
})

it('does not call handlers on keydown when selectedIndex is null', () => {
  const onClose = jest.fn()
  render(<FlyerModal events={EVENTS} selectedIndex={null} onClose={onClose} onPrev={noop} onNext={noop} />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).not.toHaveBeenCalled()
})
