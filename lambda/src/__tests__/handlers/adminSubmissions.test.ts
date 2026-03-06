import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

const { mockDDBSend, mockSMSend } = vi.hoisted(() => ({
  mockDDBSend: vi.fn(),
  mockSMSend: vi.fn(),
}))

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockReturnValue({}),
}))

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn().mockReturnValue({ send: mockDDBSend }),
  },
  QueryCommand: vi.fn().mockImplementation((input) => input),
  UpdateCommand: vi.fn().mockImplementation((input) => input),
}))

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockReturnValue({ send: vi.fn() }),
  SendEmailCommand: vi.fn(),
}))

vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn().mockReturnValue({ send: mockSMSend }),
  GetSecretValueCommand: vi.fn().mockImplementation((input) => input),
}))

import { listArtists, listSponsors, listEmailSignups, updateSponsorNotes } from '../../handlers/adminSubmissions'

const VALID_KEY = 'test-admin-secret'

function mockEvent(headers: Record<string, string> = {}, body: string | null = null): APIGatewayProxyEventV2 {
  return {
    body,
    headers,
    rawPath: '/',
    rawQueryString: '',
    requestContext: { http: { method: 'GET' } },
  } as unknown as APIGatewayProxyEventV2
}

function authedEvent(): APIGatewayProxyEventV2 {
  return mockEvent({ 'x-admin-key': VALID_KEY })
}

describe('admin auth — listArtists', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSMSend.mockResolvedValue({ SecretString: VALID_KEY })
    mockDDBSend.mockResolvedValue({ Items: [] })
  })

  it('returns 401 when x-admin-key header is absent', async () => {
    const result = await listArtists(mockEvent())
    expect(result.statusCode).toBe(401)
  })

  it('returns 401 when x-admin-key is incorrect', async () => {
    const result = await listArtists(mockEvent({ 'x-admin-key': 'wrong-key' }))
    expect(result.statusCode).toBe(401)
  })

  it('returns 200 with valid admin key', async () => {
    const result = await listArtists(authedEvent())
    expect(result.statusCode).toBe(200)
  })

  it('returns artists array in response body', async () => {
    mockDDBSend.mockResolvedValueOnce({ Items: [{ id: '1', djName: 'DJ Test' }] })
    const result = await listArtists(authedEvent())
    const body = JSON.parse(result.body as string)
    expect(body).toHaveProperty('artists')
    expect(body.artists).toHaveLength(1)
  })

  it('returns empty artists array when no pending applications', async () => {
    mockDDBSend.mockResolvedValueOnce({ Items: [] })
    const result = await listArtists(authedEvent())
    const body = JSON.parse(result.body as string)
    expect(body.artists).toEqual([])
  })

  it('queries DynamoDB with authorized request', async () => {
    await listArtists(authedEvent())
    expect(mockDDBSend).toHaveBeenCalledOnce()
  })
})

describe('admin auth — listSponsors', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSMSend.mockResolvedValue({ SecretString: VALID_KEY })
    mockDDBSend.mockResolvedValue({ Items: [] })
  })

  it('returns 401 without admin key', async () => {
    const result = await listSponsors(mockEvent())
    expect(result.statusCode).toBe(401)
  })

  it('returns 401 with wrong admin key', async () => {
    const result = await listSponsors(mockEvent({ 'x-admin-key': 'nope' }))
    expect(result.statusCode).toBe(401)
  })

  it('returns 200 with valid admin key', async () => {
    const result = await listSponsors(authedEvent())
    expect(result.statusCode).toBe(200)
  })

  it('returns sponsors array in response body', async () => {
    const result = await listSponsors(authedEvent())
    const body = JSON.parse(result.body as string)
    expect(body).toHaveProperty('sponsors')
  })
})

describe('admin auth — listEmailSignups', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSMSend.mockResolvedValue({ SecretString: VALID_KEY })
    mockDDBSend.mockResolvedValue({ Items: [] })
  })

  it('returns 401 without admin key', async () => {
    const result = await listEmailSignups(mockEvent())
    expect(result.statusCode).toBe(401)
  })

  it('returns 200 with valid admin key', async () => {
    const result = await listEmailSignups(authedEvent())
    expect(result.statusCode).toBe(200)
  })

  it('returns signups array in response body', async () => {
    const result = await listEmailSignups(authedEvent())
    const body = JSON.parse(result.body as string)
    expect(body).toHaveProperty('signups')
  })
})

describe('admin auth — updateSponsorNotes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSMSend.mockResolvedValue({ SecretString: VALID_KEY })
    mockDDBSend.mockResolvedValue({})
  })

  it('returns 401 without admin key', async () => {
    const event = mockEvent({}, '{"notes":"hello"}')
    const result = await updateSponsorNotes(event, 'sponsor-id')
    expect(result.statusCode).toBe(401)
  })

  it('returns 200 with valid admin key and updates DynamoDB', async () => {
    const event = mockEvent({ 'x-admin-key': VALID_KEY }, '{"notes":"sponsor note"}')
    const result = await updateSponsorNotes(event, 'sponsor-id')
    expect(result.statusCode).toBe(200)
    expect(mockDDBSend).toHaveBeenCalledOnce()
  })

  it('returns updated:true in response body', async () => {
    const event = mockEvent({ 'x-admin-key': VALID_KEY }, '{"notes":"note"}')
    const result = await updateSponsorNotes(event, 'some-id')
    const body = JSON.parse(result.body as string)
    expect(body.updated).toBe(true)
  })
})
