import React from 'react'
import { render } from '@testing-library/react'
import HeroSection from './HeroSection'
import type { HeroCard } from '@shared/types/heroCards'
import type { Event } from '@shared/types/events'

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }))
jest.mock('../shared/HeroCardVisual', () => ({ __esModule: true, HeroCardVisual: ({ card }: any) => <div data-testid="hero-card">{card.title}</div> }))
jest.mock('../events/EventTabBar', () => ({ __esModule: true, default: () => <div data-testid="event-tab-bar" /> }))
jest.mock('../events/UpcomingEventCard', () => ({ __esModule: true, default: ({ event }: any) => <div data-testid="upcoming-event-card">{event.title}</div> }))

const defaultProps = {
  heroCards: [] as HeroCard[],
  heroCardsLoading: false,
  upcomingEvents: [] as Event[],
  eventsLoading: false,
  onOpenModal: jest.fn(),
}

function makeCard(id: string, title: string, linkUrl: string): HeroCard {
  return { id, title, linkUrl } as HeroCard
}

function makeEvent(id: string, title: string): Event {
  return { id, title, date: '2099-01-01' } as Event
}

it('matches snapshot with no cards and no events', () => {
  const { container } = render(<HeroSection {...defaultProps} />)
  expect(container).toMatchSnapshot()
})

it('matches snapshot with hero cards and no events', () => {
  const cards = [
    makeCard('1', 'Internal Card', '/events'),
    makeCard('2', 'External Card', 'https://example.com'),
  ]
  const { container } = render(<HeroSection {...defaultProps} heroCards={cards} />)
  expect(container).toMatchSnapshot()
})

it('matches snapshot while events loading', () => {
  const { container } = render(<HeroSection {...defaultProps} eventsLoading={true} />)
  expect(container).toMatchSnapshot()
})

it('matches snapshot with upcoming event', () => {
  const events = [makeEvent('1', 'April Event')]
  const { container } = render(<HeroSection {...defaultProps} upcomingEvents={events} />)
  expect(container).toMatchSnapshot()
})

it('matches snapshot with upcoming event and hero cards', () => {
  const events = [makeEvent('1', 'April Event')]
  const cards = [makeCard('1', 'Internal Card', '/events')]
  const { container } = render(<HeroSection {...defaultProps} upcomingEvents={events} heroCards={cards} />)
  expect(container).toMatchSnapshot()
})
