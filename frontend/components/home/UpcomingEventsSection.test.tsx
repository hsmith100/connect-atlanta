import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Event } from '@shared/types/events'
import UpcomingEventsSection from './UpcomingEventsSection'

function makeEvent(id: string, title: string, date = '2099-01-01', startTime?: string): Event {
  return { id, title, date, ...(startTime ? { startTime } : {}) } as Event
}

// ── loading state ─────────────────────────────────────────────────────────────

describe('loading state', () => {
  it('shows spinner while loading', () => {
    render(<UpcomingEventsSection events={[]} loading={true} onOpenModal={jest.fn()} />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('does not show empty state while loading', () => {
    render(<UpcomingEventsSection events={[]} loading={true} onOpenModal={jest.fn()} />)
    expect(screen.queryByText(/new events coming soon/i)).not.toBeInTheDocument()
  })
})

// ── empty state ───────────────────────────────────────────────────────────────

describe('empty state', () => {
  it('shows coming soon message when no events', () => {
    render(<UpcomingEventsSection events={[]} loading={false} onOpenModal={jest.fn()} />)
    expect(screen.getByText(/new events coming soon/i)).toBeInTheDocument()
  })

  it('calls onOpenModal when "Join Our Mailing List" is clicked', () => {
    const onOpenModal = jest.fn()
    render(<UpcomingEventsSection events={[]} loading={false} onOpenModal={onOpenModal} />)
    fireEvent.click(screen.getByRole('button', { name: /join our mailing list/i }))
    expect(onOpenModal).toHaveBeenCalledTimes(1)
  })
})

// ── single event ──────────────────────────────────────────────────────────────

describe('single event', () => {
  it('shows the event without tab buttons', async () => {
    render(<UpcomingEventsSection events={[makeEvent('a', 'Spring Beats')]} loading={false} onOpenModal={jest.fn()} />)
    // EventTabBar renders null for < 2 events so no pill buttons
    await waitFor(() => expect(screen.queryAllByRole('button', { name: 'Spring Beats' })).toHaveLength(0))
  })
})

// ── multiple events ───────────────────────────────────────────────────────────

describe('multiple events', () => {
  it('renders a tab button for each event', async () => {
    const events = [makeEvent('a', 'Spring Beats'), makeEvent('b', 'Summer Beats')]
    render(<UpcomingEventsSection events={events} loading={false} onOpenModal={jest.fn()} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Spring Beats' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Summer Beats' })).toBeInTheDocument()
  })

  it('marks the default tab as active', async () => {
    const events = [makeEvent('a', 'Spring Beats'), makeEvent('b', 'Summer Beats')]
    render(<UpcomingEventsSection events={events} loading={false} onOpenModal={jest.fn()} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Spring Beats' })).toHaveAttribute('aria-pressed', 'true'))
  })

  it('switches active tab on click', async () => {
    const events = [makeEvent('a', 'Spring Beats'), makeEvent('b', 'Summer Beats')]
    render(<UpcomingEventsSection events={events} loading={false} onOpenModal={jest.fn()} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Summer Beats' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Summer Beats' }))
    expect(screen.getByRole('button', { name: 'Summer Beats' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Spring Beats' })).toHaveAttribute('aria-pressed', 'false')
  })
})

// ── tab order matches chronological order ─────────────────────────────────────
//
// The active/default tab should always be the leftmost tab. index.tsx sorts
// upcoming events ascending by date before passing them here, so the earliest
// event is always first in the array. These tests lock in that contract.

describe('tab order matches chronological order', () => {
  it('when events are sorted earliest-first, the leftmost tab is the default active', async () => {
    const events = [
      makeEvent('early', 'Spring Beats', '2099-06-01'),
      makeEvent('late', 'Summer Beats', '2099-09-01'),
    ]
    render(<UpcomingEventsSection events={events} loading={false} onOpenModal={jest.fn()} />)
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveTextContent('Spring Beats')
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
      expect(buttons[1]).toHaveAttribute('aria-pressed', 'false')
    })
  })

  it('when events are sorted earliest-first, the later event is the rightmost tab', async () => {
    const events = [
      makeEvent('early', 'Spring Beats', '2099-06-01'),
      makeEvent('late', 'Summer Beats', '2099-09-01'),
    ]
    render(<UpcomingEventsSection events={events} loading={false} onOpenModal={jest.fn()} />)
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      expect(buttons[1]).toHaveTextContent('Summer Beats')
    })
  })

  it('regression: if events arrive in reverse order, the earlier event is still the default active', async () => {
    // Before the fix in index.tsx, DynamoDB insertion order could place the later-dated
    // event at index 0, making the active tab land on the right instead of the left.
    const events = [
      makeEvent('late', 'Summer Beats', '2099-09-01'),
      makeEvent('early', 'Spring Beats', '2099-06-01'),
    ]
    render(<UpcomingEventsSection events={events} loading={false} onOpenModal={jest.fn()} />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Spring Beats' })).toHaveAttribute('aria-pressed', 'true')
    )
    expect(screen.getByRole('button', { name: 'Summer Beats' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('regression: same-date events with different start times — earlier event is the default active', async () => {
    // Afters (22:00) arrived before Beats on the Block (14:00) from DynamoDB.
    // index.tsx now sorts by getEventDatetimes so Beats on the Block (14:00) is first.
    const events = [
      makeEvent('main', 'Beats on the Block', '2099-06-06', '14:00'),
      makeEvent('afters', 'Afters', '2099-06-06', '22:00'),
    ]
    render(<UpcomingEventsSection events={events} loading={false} onOpenModal={jest.fn()} />)
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveTextContent('Beats on the Block')
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
      expect(buttons[1]).toHaveAttribute('aria-pressed', 'false')
    })
  })
})
