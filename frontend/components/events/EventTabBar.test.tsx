import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import EventTabBar from './EventTabBar'
import type { Event } from '@shared/types/events'

function makeEvent(id: string, title: string): Event {
  return { id, title, date: '2026-06-01' } as Event
}

const events2 = [makeEvent('a', 'Spring Beats'), makeEvent('b', 'Summer Beats')]
const events3 = [makeEvent('a', 'Spring Beats'), makeEvent('b', 'Summer Beats'), makeEvent('c', 'Fall Beats')]

// ── renders nothing for fewer than 2 events ──────────────────────────────────

describe('renders nothing for fewer than 2 events', () => {
  it('renders nothing when events is empty', () => {
    const { container } = render(
      <EventTabBar events={[]} activeEventId={null} onSelect={jest.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when there is exactly 1 event', () => {
    const { container } = render(
      <EventTabBar events={[makeEvent('a', 'Spring Beats')]} activeEventId="a" onSelect={jest.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })
})

// ── renders tab buttons for 2+ events ────────────────────────────────────────

describe('renders tab buttons for 2+ events', () => {
  it('renders one button per event', () => {
    render(<EventTabBar events={events2} activeEventId="a" onSelect={jest.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('button labels match event titles', () => {
    render(<EventTabBar events={events3} activeEventId="a" onSelect={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Spring Beats' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Summer Beats' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fall Beats' })).toBeInTheDocument()
  })
})

// ── active state ──────────────────────────────────────────────────────────────

describe('active state', () => {
  it('active button has aria-pressed="true"', () => {
    render(<EventTabBar events={events2} activeEventId="b" onSelect={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Summer Beats' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('inactive buttons have aria-pressed="false"', () => {
    render(<EventTabBar events={events2} activeEventId="b" onSelect={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Spring Beats' })).toHaveAttribute('aria-pressed', 'false')
  })
})

// ── interaction ───────────────────────────────────────────────────────────────

describe('interaction', () => {
  it('calls onSelect with correct event id when inactive tab is clicked', () => {
    const onSelect = jest.fn()
    render(<EventTabBar events={events2} activeEventId="a" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Summer Beats' }))
    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('calls onSelect with correct event id when active tab is clicked', () => {
    const onSelect = jest.fn()
    render(<EventTabBar events={events2} activeEventId="a" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Spring Beats' }))
    expect(onSelect).toHaveBeenCalledWith('a')
  })
})
