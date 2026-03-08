import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import EventFlyerCard from './EventFlyerCard'
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

it('renders the event flyer image with event title as alt', () => {
  render(<EventFlyerCard event={BASE_EVENT} />)
  const img = screen.getByAltText('Beats on the Beltline')
  expect(img).toBeInTheDocument()
  expect(img).toHaveAttribute('src', 'https://example.com/flyer.jpg')
})

it('calls onClick when the card is clicked', () => {
  const onClick = jest.fn()
  render(<EventFlyerCard event={BASE_EVENT} onClick={onClick} />)
  fireEvent.click(screen.getByAltText('Beats on the Beltline').closest('div')!)
  expect(onClick).toHaveBeenCalledTimes(1)
})

it('does not throw when onClick is not provided', () => {
  expect(() => {
    render(<EventFlyerCard event={BASE_EVENT} />)
  }).not.toThrow()
})
