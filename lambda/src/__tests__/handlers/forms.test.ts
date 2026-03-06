import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

// Hoisted mock functions — must be defined before vi.mock factories run
const { mockEmailSignup, mockArtistApplication, mockSponsorInquiry, mockContactForm, mockListArtists, mockListSponsors, mockListEmailSignups, mockUpdateSponsorNotes } = vi.hoisted(() => ({
  mockEmailSignup: vi.fn(),
  mockArtistApplication: vi.fn(),
  mockSponsorInquiry: vi.fn(),
  mockContactForm: vi.fn(),
  mockListArtists: vi.fn(),
  mockListSponsors: vi.fn(),
  mockListEmailSignups: vi.fn(),
  mockUpdateSponsorNotes: vi.fn(),
}))

// Mock AWS SDK — prevents real client construction and credential lookups
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockReturnValue({}),
}))
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: vi.fn().mockReturnValue({ send: vi.fn() }) },
}))
vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockReturnValue({ send: vi.fn() }),
  SendEmailCommand: vi.fn(),
}))

// Mock form handler modules
vi.mock('../../handlers/formSubmissions', () => ({
  FORM_ROUTES: {
    'email-signup': mockEmailSignup,
    'artist-application': mockArtistApplication,
    'sponsor-inquiry': mockSponsorInquiry,
    'contact': mockContactForm,
  },
}))

vi.mock('../../handlers/adminSubmissions', () => ({
  listArtists: mockListArtists,
  listSponsors: mockListSponsors,
  listEmailSignups: mockListEmailSignups,
  updateSponsorNotes: mockUpdateSponsorNotes,
}))

import { handler } from '../../handlers/forms'

function mockEvent(method: string, path: string, body: string | null = null): APIGatewayProxyEventV2 {
  return {
    body,
    headers: {},
    rawPath: path,
    rawQueryString: '',
    requestContext: { http: { method } },
  } as unknown as APIGatewayProxyEventV2
}

const ok201 = { statusCode: 201, headers: {}, body: '{"success":true}' }
const ok200 = { statusCode: 200, headers: {}, body: '{"items":[]}' }

describe('forms handler — public form routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes POST /api/forms/email-signup to the email-signup handler', async () => {
    mockEmailSignup.mockResolvedValueOnce(ok201)
    const event = mockEvent('POST', '/api/forms/email-signup', JSON.stringify({ name: 'Alice', email: 'a@b.com' }))
    await handler(event)
    expect(mockEmailSignup).toHaveBeenCalledOnce()
  })

  it('routes POST /api/forms/artist-application to the artist-application handler', async () => {
    mockArtistApplication.mockResolvedValueOnce(ok201)
    const event = mockEvent('POST', '/api/forms/artist-application', JSON.stringify({ email: 'dj@example.com' }))
    await handler(event)
    expect(mockArtistApplication).toHaveBeenCalledOnce()
  })

  it('routes POST /api/forms/sponsor-inquiry to the sponsor-inquiry handler', async () => {
    mockSponsorInquiry.mockResolvedValueOnce(ok201)
    const event = mockEvent('POST', '/api/forms/sponsor-inquiry', JSON.stringify({ company: 'Acme' }))
    await handler(event)
    expect(mockSponsorInquiry).toHaveBeenCalledOnce()
  })

  it('routes POST /api/forms/contact to the contact handler', async () => {
    mockContactForm.mockResolvedValueOnce(ok201)
    const event = mockEvent('POST', '/api/forms/contact', JSON.stringify({ message: 'Hello' }))
    await handler(event)
    expect(mockContactForm).toHaveBeenCalledOnce()
  })

  it('returns 404 for an unknown form type', async () => {
    const event = mockEvent('POST', '/api/forms/nonexistent', '{}')
    const result = await handler(event)
    expect(result.statusCode).toBe(404)
  })

  it('returns 400 when request body is missing', async () => {
    const event = mockEvent('POST', '/api/forms/email-signup', null)
    const result = await handler(event)
    expect(result.statusCode).toBe(400)
  })

  it('returns 400 when request body is invalid JSON', async () => {
    const event = mockEvent('POST', '/api/forms/email-signup', 'not-json')
    const result = await handler(event)
    expect(result.statusCode).toBe(400)
  })

  it('passes the parsed body to the form handler', async () => {
    mockEmailSignup.mockResolvedValueOnce(ok201)
    const payload = { name: 'Bob', email: 'bob@example.com' }
    const event = mockEvent('POST', '/api/forms/email-signup', JSON.stringify(payload))
    await handler(event)
    expect(mockEmailSignup).toHaveBeenCalledWith(payload)
  })
})

describe('forms handler — admin submission routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes GET /api/admin/submissions/artists to listArtists', async () => {
    mockListArtists.mockResolvedValueOnce(ok200)
    const event = mockEvent('GET', '/api/admin/submissions/artists')
    await handler(event)
    expect(mockListArtists).toHaveBeenCalledOnce()
  })

  it('routes GET /api/admin/submissions/sponsors to listSponsors', async () => {
    mockListSponsors.mockResolvedValueOnce(ok200)
    const event = mockEvent('GET', '/api/admin/submissions/sponsors')
    await handler(event)
    expect(mockListSponsors).toHaveBeenCalledOnce()
  })

  it('routes GET /api/admin/submissions/email-signups to listEmailSignups', async () => {
    mockListEmailSignups.mockResolvedValueOnce(ok200)
    const event = mockEvent('GET', '/api/admin/submissions/email-signups')
    await handler(event)
    expect(mockListEmailSignups).toHaveBeenCalledOnce()
  })

  it('routes PATCH /api/admin/submissions/sponsors/:id to updateSponsorNotes', async () => {
    mockUpdateSponsorNotes.mockResolvedValueOnce(ok200)
    const event = mockEvent('PATCH', '/api/admin/submissions/sponsors/abc-123', '{"notes":"test"}')
    await handler(event)
    expect(mockUpdateSponsorNotes).toHaveBeenCalledOnce()
  })

  it('passes the sponsor id to updateSponsorNotes', async () => {
    mockUpdateSponsorNotes.mockResolvedValueOnce(ok200)
    const event = mockEvent('PATCH', '/api/admin/submissions/sponsors/my-id-456', '{"notes":"note"}')
    await handler(event)
    expect(mockUpdateSponsorNotes).toHaveBeenCalledWith(expect.anything(), 'my-id-456')
  })

  it('returns 404 for unrecognized paths', async () => {
    const event = mockEvent('GET', '/api/unknown')
    const result = await handler(event)
    expect(result.statusCode).toBe(404)
  })
})
