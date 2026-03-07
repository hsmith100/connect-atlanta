import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Event } from '@shared/types/events'

// ── mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../lib/api', () => ({
  getEvents: jest.fn(),
  getHeroCards: jest.fn(),
}))

// Stub Next.js components used by the page
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }))
jest.mock('next/image', () => ({ __esModule: true, default: ({ src, alt, ...rest }: any) => <img src={src} alt={alt} /> }))
jest.mock('next/router', () => ({ useRouter: () => ({ isReady: false, query: {} }) }))

// Suppress console noise
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterAll(() => {
  (console.error as jest.Mock).mockRestore()
})

// scrollIntoView not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = jest.fn()

// IntersectionObserver not implemented in jsdom
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

import { getEvents, getHeroCards } from '../lib/api'
import Home from './index'

function makeEvent(id: string, title: string, date = '2099-01-01'): Event {
  return { id, title, date } as Event
}

beforeEach(() => {
  (getHeroCards as jest.Mock).mockResolvedValue([]);
  (getEvents as jest.Mock).mockResolvedValue([])
})

afterEach(() => {
  jest.clearAllMocks()
})

// ── upcoming events tab behavior ──────────────────────────────────────────────

describe('upcoming events tab behavior', () => {
  it('shows loading state initially', () => {
    // Never resolves during this test
    ;(getEvents as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<Home />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows one UpcomingEventCard with no tabs when there is 1 upcoming event', async () => {
    ;(getEvents as jest.Mock).mockResolvedValue([makeEvent('a', 'Spring Beats')])
    render(<Home />)
    await waitFor(() => expect(screen.queryByText('Spring Beats')).toBeInTheDocument())
    // No tab buttons — EventTabBar returns null for < 2 events
    expect(screen.queryAllByRole('button', { name: 'Spring Beats' })).toHaveLength(0)
  })

  it('shows EventTabBar + default active card when there are 2 upcoming events', async () => {
    ;(getEvents as jest.Mock).mockResolvedValue([
      makeEvent('a', 'Spring Beats'),
      makeEvent('b', 'Summer Beats'),
    ])
    render(<Home />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Spring Beats' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Summer Beats' })).toBeInTheDocument()
  })

  it('switches displayed event when a tab is clicked', async () => {
    ;(getEvents as jest.Mock).mockResolvedValue([
      makeEvent('a', 'Spring Beats'),
      makeEvent('b', 'Summer Beats'),
    ])
    render(<Home />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Summer Beats' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Summer Beats' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Summer Beats' })).toHaveAttribute('aria-pressed', 'true')
    )
  })

  it('shows empty state message when there are no upcoming events', async () => {
    ;(getEvents as jest.Mock).mockResolvedValue([])
    render(<Home />)
    await waitFor(() => expect(screen.getByText(/new events coming soon/i)).toBeInTheDocument())
  })
})
