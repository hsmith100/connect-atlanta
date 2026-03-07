import React from 'react'
import { render } from '@testing-library/react'
import PastEventsSection from './PastEventsSection'
import type { Event } from '@shared/types/events'

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }))
jest.mock('../events/EventFlyerCard', () => ({ __esModule: true, default: ({ event }: any) => <div data-testid="flyer-card">{event.title}</div> }))
jest.mock('../events/FlyerModal', () => ({ __esModule: true, default: () => null }))

function makeEvent(id: string, title: string): Event {
  return { id, title, date: '2025-01-01' } as Event
}

it('matches snapshot with no events', () => {
  const { container } = render(<PastEventsSection events={[]} loading={false} />)
  expect(container).toMatchSnapshot()
})

it('matches snapshot with events', () => {
  const events = [makeEvent('a', 'Spring Beats'), makeEvent('b', 'Summer Beats')]
  const { container } = render(<PastEventsSection events={events} loading={false} />)
  expect(container).toMatchSnapshot()
})
