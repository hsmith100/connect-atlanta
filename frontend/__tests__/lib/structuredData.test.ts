import { describe, it, expect } from 'vitest'
import {
  organizationSchema,
  eventSeriesSchema,
  websiteSchema,
  localBusinessSchema,
  createEventSchema,
  breadcrumbSchema,
} from '../../lib/structuredData'

describe('organizationSchema', () => {
  it('has the correct @context and @type', () => {
    expect(organizationSchema['@context']).toBe('https://schema.org')
    expect(organizationSchema['@type']).toBe('Organization')
  })

  it('includes Connect Events name', () => {
    expect(organizationSchema.name).toBe('Connect Events')
  })

  it('includes Atlanta address', () => {
    expect(organizationSchema.address.addressLocality).toBe('Atlanta')
    expect(organizationSchema.address.addressRegion).toBe('GA')
  })
})

describe('eventSeriesSchema', () => {
  it('has the correct @context and @type', () => {
    expect(eventSeriesSchema['@context']).toBe('https://schema.org')
    expect(eventSeriesSchema['@type']).toBe('EventSeries')
  })

  it('is marked as free and offline', () => {
    expect(eventSeriesSchema.isAccessibleForFree).toBe(true)
    expect(eventSeriesSchema.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode')
  })

  it('includes Atlanta BeltLine as location', () => {
    expect(eventSeriesSchema.location.name).toBe('Atlanta BeltLine')
  })
})

describe('websiteSchema', () => {
  it('has the correct @context and @type', () => {
    expect(websiteSchema['@context']).toBe('https://schema.org')
    expect(websiteSchema['@type']).toBe('WebSite')
  })

  it('references connectevents.co', () => {
    expect(websiteSchema.url).toBe('https://connectevents.co')
  })
})

describe('localBusinessSchema', () => {
  it('has the correct @context and @type', () => {
    expect(localBusinessSchema['@context']).toBe('https://schema.org')
    expect(localBusinessSchema['@type']).toBe('LocalBusiness')
  })

  it('includes Atlanta address', () => {
    expect(localBusinessSchema.address.addressLocality).toBe('Atlanta')
  })
})

describe('createEventSchema', () => {
  const baseEvent = {
    title: 'Beats on the Beltline Vol. 5',
    date: '2025-09-20',
  }

  it('returns a MusicEvent schema', () => {
    const schema = createEventSchema(baseEvent) as Record<string, unknown>
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('MusicEvent')
  })

  it('uses the event title as name', () => {
    const schema = createEventSchema(baseEvent) as Record<string, unknown>
    expect(schema.name).toBe(baseEvent.title)
  })

  it('uses the event date as startDate', () => {
    const schema = createEventSchema(baseEvent) as Record<string, unknown>
    expect(schema.startDate).toBe(baseEvent.date)
  })

  it('falls back to startDate for endDate when not provided', () => {
    const schema = createEventSchema(baseEvent) as Record<string, unknown>
    expect(schema.endDate).toBe(baseEvent.date)
  })

  it('uses provided endDate when available', () => {
    const schema = createEventSchema({ ...baseEvent, endDate: '2025-09-21' }) as Record<string, unknown>
    expect(schema.endDate).toBe('2025-09-21')
  })

  it('marks event as free and offline', () => {
    const schema = createEventSchema(baseEvent) as Record<string, unknown>
    expect(schema.isAccessibleForFree).toBe(true)
    expect(schema.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode')
  })

  it('includes artist performer when artists are provided', () => {
    const schema = createEventSchema({ ...baseEvent, artists: 'DJ Atlas' }) as Record<string, unknown>
    const performer = schema.performer as Record<string, unknown>
    expect(performer).toBeDefined()
    expect(performer['@type']).toBe('PerformingGroup')
    expect(performer.name).toBe('DJ Atlas')
  })

  it('omits performer when no artists are provided', () => {
    const schema = createEventSchema(baseEvent) as Record<string, unknown>
    expect(schema.performer).toBeUndefined()
  })

  it('uses flyerUrl when provided (prefixed with domain)', () => {
    const schema = createEventSchema({ ...baseEvent, flyerUrl: '/flyers/event.jpg' }) as Record<string, unknown>
    expect(schema.image).toBe('https://connectevents.co/flyers/event.jpg')
  })

  it('uses fallback image when flyerUrl is absent', () => {
    const schema = createEventSchema(baseEvent) as Record<string, unknown>
    expect(typeof schema.image).toBe('string')
    expect(schema.image as string).toContain('connectevents.co')
  })

  it('uses default description when none is provided', () => {
    const schema = createEventSchema(baseEvent) as Record<string, unknown>
    expect(typeof schema.description).toBe('string')
    expect((schema.description as string).length).toBeGreaterThan(0)
  })

  it('uses provided description', () => {
    const schema = createEventSchema({ ...baseEvent, description: 'Custom desc' }) as Record<string, unknown>
    expect(schema.description).toBe('Custom desc')
  })

  it('uses provided location name', () => {
    const schema = createEventSchema({ ...baseEvent, location: 'Piedmont Park' }) as Record<string, unknown>
    const location = schema.location as Record<string, unknown>
    expect(location.name).toBe('Piedmont Park')
  })

  it('defaults location to Atlanta BeltLine', () => {
    const schema = createEventSchema(baseEvent) as Record<string, unknown>
    const location = schema.location as Record<string, unknown>
    expect(location.name).toBe('Atlanta BeltLine')
  })

  it('includes a free Offer', () => {
    const schema = createEventSchema(baseEvent) as Record<string, unknown>
    const offers = schema.offers as Record<string, unknown>
    expect(offers.price).toBe('0')
    expect(offers.priceCurrency).toBe('USD')
  })
})

describe('breadcrumbSchema', () => {
  it('returns a BreadcrumbList schema', () => {
    const schema = breadcrumbSchema([{ name: 'Home', url: '/' }]) as Record<string, unknown>
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('BreadcrumbList')
  })

  it('maps items to ListItems with correct position', () => {
    const schema = breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Events', url: '/events' },
    ]) as Record<string, unknown>
    const items = schema.itemListElement as Array<Record<string, unknown>>
    expect(items).toHaveLength(2)
    expect(items[0].position).toBe(1)
    expect(items[1].position).toBe(2)
  })

  it('prefixes item URLs with connectevents.co domain', () => {
    const schema = breadcrumbSchema([{ name: 'Events', url: '/events' }]) as Record<string, unknown>
    const items = schema.itemListElement as Array<Record<string, unknown>>
    expect(items[0].item).toBe('https://connectevents.co/events')
  })

  it('includes item name', () => {
    const schema = breadcrumbSchema([{ name: 'Join', url: '/join' }]) as Record<string, unknown>
    const items = schema.itemListElement as Array<Record<string, unknown>>
    expect(items[0].name).toBe('Join')
  })

  it('returns empty itemListElement for empty input', () => {
    const schema = breadcrumbSchema([]) as Record<string, unknown>
    const items = schema.itemListElement as unknown[]
    expect(items).toHaveLength(0)
  })
})
