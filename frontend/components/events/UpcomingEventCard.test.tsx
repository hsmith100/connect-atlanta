import React from 'react'
import { render, screen } from '@testing-library/react'
import UpcomingEventCard from './UpcomingEventCard'
import type { Event } from '@shared/types/events'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}))

const BASE_EVENT: Event = {
  id: 'ev-1',
  entity: 'EVENT',
  title: 'Beats on the Beltline',
  date: '2026-06-15',
  startTime: '18:00',
  endTime: '22:00',
  location: 'Atlanta Beltline',
  flyerUrl: 'https://example.com/flyer.jpg',
  ticketingUrl: null,
  goLiveAt: null,
  description: null,
  buttonText: null,
}

it('renders the event title', () => {
  render(<UpcomingEventCard event={BASE_EVENT} />)
  expect(screen.getByText('Beats on the Beltline')).toBeInTheDocument()
})

it('renders the event location', () => {
  render(<UpcomingEventCard event={BASE_EVENT} />)
  expect(screen.getByText('Atlanta Beltline')).toBeInTheDocument()
})

it('renders the flyer image when flyerUrl is provided', () => {
  render(<UpcomingEventCard event={BASE_EVENT} />)
  const img = screen.getByAltText('Beats on the Beltline')
  expect(img).toHaveAttribute('src', 'https://example.com/flyer.jpg')
})

it('renders a placeholder when flyerUrl is null', () => {
  render(<UpcomingEventCard event={{ ...BASE_EVENT, flyerUrl: null }} />)
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})

it('renders description when provided', () => {
  render(<UpcomingEventCard event={{ ...BASE_EVENT, description: 'An amazing festival' }} />)
  expect(screen.getByText('An amazing festival')).toBeInTheDocument()
})

it('does not render description when null', () => {
  render(<UpcomingEventCard event={BASE_EVENT} />)
  expect(screen.queryByText('An amazing festival')).not.toBeInTheDocument()
})

it('renders ticket link when ticketingUrl is provided', () => {
  render(<UpcomingEventCard event={{ ...BASE_EVENT, ticketingUrl: 'https://tickets.example.com' }} />)
  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', 'https://tickets.example.com')
})

it('renders custom buttonText when provided', () => {
  render(<UpcomingEventCard event={{ ...BASE_EVENT, ticketingUrl: 'https://t.example.com', buttonText: 'Buy Tickets' }} />)
  expect(screen.getByText('Buy Tickets')).toBeInTheDocument()
})

it('renders default button text when buttonText is null', () => {
  render(<UpcomingEventCard event={{ ...BASE_EVENT, ticketingUrl: 'https://t.example.com', buttonText: null }} />)
  expect(screen.getByText('Get Info & Updates')).toBeInTheDocument()
})

it('does not render a ticket link when ticketingUrl is null', () => {
  render(<UpcomingEventCard event={BASE_EVENT} />)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})
