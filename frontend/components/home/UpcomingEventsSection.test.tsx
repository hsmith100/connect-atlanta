import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Event } from '@shared/types/events'
import UpcomingEventsSection from './UpcomingEventsSection'

function makeEvent(id: string, title: string, date = '2099-01-01'): Event {
  return { id, title, date } as Event
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
