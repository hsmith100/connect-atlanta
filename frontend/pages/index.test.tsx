import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('../lib/api', () => ({
  getEvents: jest.fn(),
  getHeroCards: jest.fn(),
}))

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }))
jest.mock('next/image', () => ({ __esModule: true, default: ({ src, alt }: any) => <img src={src} alt={alt} /> }))
jest.mock('next/router', () => ({ useRouter: () => ({ isReady: false, query: {} }) }))

beforeAll(() => { jest.spyOn(console, 'error').mockImplementation(() => {}) })
afterAll(() => { (console.error as jest.Mock).mockRestore() })

window.HTMLElement.prototype.scrollIntoView = jest.fn()
global.IntersectionObserver = class {
  observe() {} unobserve() {} disconnect() {}
} as any

import { getEvents, getHeroCards } from '../lib/api'
import Home from './index'
import type { Event } from '@shared/types/events'

function makeEvent(id: string, title: string, date = '2099-01-01'): Event {
  return { id, title, date } as Event
}

beforeEach(() => {
  ;(getHeroCards as jest.Mock).mockResolvedValue([])
  ;(getEvents as jest.Mock).mockResolvedValue([])
})

afterEach(() => { jest.clearAllMocks() })

// ── page orchestration ────────────────────────────────────────────────────────

describe('page orchestration', () => {
  it('renders without crashing', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /upcoming events/i })).toBeInTheDocument()
  })

  it('shows loading spinner on mount', () => {
    ;(getEvents as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<Home />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows empty state after load with no events', async () => {
    render(<Home />)
    await waitFor(() => expect(screen.getByText(/new events coming soon/i)).toBeInTheDocument())
  })

  it('passes upcoming events to UpcomingEventsSection', async () => {
    ;(getEvents as jest.Mock).mockResolvedValue([makeEvent('a', 'Spring Beats')])
    render(<Home />)
    // Spring Beats appears as the event card title (not a tab button — only 1 event)
    await waitFor(() => expect(screen.getByText('Spring Beats')).toBeInTheDocument())
  })

  it('fetches hero cards and events on mount', async () => {
    render(<Home />)
    await waitFor(() => {
      expect(getHeroCards).toHaveBeenCalledTimes(1)
      expect(getEvents).toHaveBeenCalledTimes(1)
    })
  })
})
