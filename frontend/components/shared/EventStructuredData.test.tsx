import React from 'react'
import { render } from '@testing-library/react'
import EventStructuredData from './EventStructuredData'

function getScript() {
  return document.querySelector('script[type="application/ld+json"]')
}

function getParsed() {
  const el = getScript()
  return el ? JSON.parse(el.innerHTML) : null
}

afterEach(() => {
  document.body.innerHTML = ''
})

// ── renders ────────────────────────────────────────────────────────────────────

it('renders a JSON-LD script tag', () => {
  render(<EventStructuredData />)
  expect(getScript()).toBeInTheDocument()
})

// ── defaults ───────────────────────────────────────────────────────────────────

describe('defaults', () => {
  it('sets @context to schema.org', () => {
    render(<EventStructuredData />)
    expect(getParsed()['@context']).toBe('https://schema.org')
  })

  it('sets @type to MusicEvent', () => {
    render(<EventStructuredData />)
    expect(getParsed()['@type']).toBe('MusicEvent')
  })

  it('includes a default name', () => {
    render(<EventStructuredData />)
    expect(getParsed().name).toBe('Music Festival 2025')
  })

  it('includes default performers', () => {
    render(<EventStructuredData />)
    const performers = getParsed().performer
    expect(performers).toHaveLength(3)
    expect(performers[0]).toMatchObject({ '@type': 'MusicGroup', name: 'Artist Name 1' })
  })

  it('includes default location', () => {
    render(<EventStructuredData />)
    const location = getParsed().location
    expect(location['@type']).toBe('Place')
    expect(location.name).toBe('Festival Grounds')
    expect(location.address.addressLocality).toBe('City Name')
  })

  it('includes eventStatus and eventAttendanceMode', () => {
    render(<EventStructuredData />)
    const data = getParsed()
    expect(data.eventStatus).toBe('https://schema.org/EventScheduled')
    expect(data.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode')
  })
})

// ── custom props ───────────────────────────────────────────────────────────────

describe('custom props', () => {
  it('uses the provided name', () => {
    render(<EventStructuredData name="Beats on the Beltline 2026" />)
    expect(getParsed().name).toBe('Beats on the Beltline 2026')
  })

  it('uses the provided description', () => {
    render(<EventStructuredData description="Free outdoor festival" />)
    expect(getParsed().description).toBe('Free outdoor festival')
  })

  it('uses the provided startDate and endDate', () => {
    render(<EventStructuredData startDate="2026-06-01T12:00:00-05:00" endDate="2026-06-01T22:00:00-05:00" />)
    const data = getParsed()
    expect(data.startDate).toBe('2026-06-01T12:00:00-05:00')
    expect(data.endDate).toBe('2026-06-01T22:00:00-05:00')
  })

  it('maps performers array to MusicGroup objects', () => {
    render(<EventStructuredData performers={['DJ Alpha', 'DJ Beta']} />)
    const performers = getParsed().performer
    expect(performers).toHaveLength(2)
    expect(performers[0]).toEqual({ '@type': 'MusicGroup', name: 'DJ Alpha' })
    expect(performers[1]).toEqual({ '@type': 'MusicGroup', name: 'DJ Beta' })
  })

  it('uses the provided location fields', () => {
    render(
      <EventStructuredData
        locationName="Piedmont Park"
        streetAddress="400 Park Dr NE"
        addressLocality="Atlanta"
        addressRegion="GA"
        postalCode="30309"
        country="US"
      />
    )
    const address = getParsed().location.address
    expect(address.streetAddress).toBe('400 Park Dr NE')
    expect(address.addressLocality).toBe('Atlanta')
    expect(address.addressRegion).toBe('GA')
    expect(address.postalCode).toBe('30309')
    expect(address.addressCountry).toBe('US')
  })

  it('uses the provided ticket price and URL', () => {
    render(<EventStructuredData ticketPrice="0" ticketUrl="https://connectevents.co/tickets" />)
    const offer = getParsed().offers
    expect(offer.price).toBe('0')
    expect(offer.url).toBe('https://connectevents.co/tickets')
    expect(offer.priceCurrency).toBe('USD')
  })

  it('uses the provided organizer info', () => {
    render(<EventStructuredData organizerName="Connect Events" organizerUrl="https://connectevents.co" />)
    const organizer = getParsed().organizer
    expect(organizer.name).toBe('Connect Events')
    expect(organizer.url).toBe('https://connectevents.co')
  })

  it('includes the imageUrl in the image array', () => {
    render(<EventStructuredData imageUrl="https://connectevents.co/og.jpg" />)
    expect(getParsed().image).toContain('https://connectevents.co/og.jpg')
  })
})
