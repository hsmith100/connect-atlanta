import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

// vi.mock calls are hoisted — these run before any imports
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockReturnValue({}),
}))

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn().mockReturnValue({ send: vi.fn() }),
  },
}))

const mockSESSend = vi.hoisted(() => vi.fn())

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockReturnValue({ send: mockSESSend }),
  SendEmailCommand: vi.fn().mockImplementation((input) => input),
}))

import { ok, created, errResponse, parseBody, parsePayload, newItem, sendEmail } from '../../lib/formShared'

function mockEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    body: null,
    headers: {},
    rawPath: '/',
    rawQueryString: '',
    requestContext: { http: { method: 'GET' } },
    ...overrides,
  } as unknown as APIGatewayProxyEventV2
}

describe('ok', () => {
  it('returns 200 with JSON body', () => {
    const result = ok({ success: true })
    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body as string)).toEqual({ success: true })
  })

  it('includes CORS headers', () => {
    const result = ok({})
    expect((result.headers as Record<string, string>)['Access-Control-Allow-Origin']).toBe('*')
  })
})

describe('created', () => {
  it('returns 201 with JSON body', () => {
    const result = created({ id: 'abc' })
    expect(result.statusCode).toBe(201)
    expect(JSON.parse(result.body as string)).toEqual({ id: 'abc' })
  })

  it('includes CORS headers', () => {
    const result = created({})
    expect((result.headers as Record<string, string>)['Access-Control-Allow-Origin']).toBe('*')
  })
})

describe('errResponse', () => {
  it('returns the given status code with error message', () => {
    const result = errResponse(400, 'Bad input')
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body as string)).toEqual({ error: 'Bad input' })
  })

  it('returns 404 with error message', () => {
    const result = errResponse(404, 'Not found')
    expect(result.statusCode).toBe(404)
    expect(JSON.parse(result.body as string)).toEqual({ error: 'Not found' })
  })

  it('returns 500 with error message', () => {
    const result = errResponse(500, 'Internal server error')
    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body as string)).toEqual({ error: 'Internal server error' })
  })

  it('includes CORS headers', () => {
    const result = errResponse(400, 'err')
    expect((result.headers as Record<string, string>)['Access-Control-Allow-Origin']).toBe('*')
  })
})

describe('parseBody', () => {
  it('throws when body is null', () => {
    expect(() => parseBody(mockEvent({ body: null }))).toThrow('Missing request body')
  })

  it('throws when body is invalid JSON', () => {
    expect(() => parseBody(mockEvent({ body: 'not-json' }))).toThrow('Invalid JSON body')
  })

  it('throws when body is empty string', () => {
    expect(() => parseBody(mockEvent({ body: '' }))).toThrow()
  })

  it('returns parsed payload for valid JSON body', () => {
    const payload = { name: 'Alice', email: 'alice@example.com' }
    const result = parseBody(mockEvent({ body: JSON.stringify(payload) }))
    expect(result).toEqual(payload)
  })

  it('parses nested values', () => {
    const payload = { tags: ['a', 'b'], count: 3, active: true }
    const result = parseBody(mockEvent({ body: JSON.stringify(payload) }))
    expect(result).toEqual(payload)
  })
})

describe('parsePayload', () => {
  it('returns ok:true when all required fields are present', () => {
    const result = parsePayload<{ name: string; email: string }>(
      { name: 'Alice', email: 'alice@example.com' },
      ['name', 'email'],
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.name).toBe('Alice')
      expect(result.data.email).toBe('alice@example.com')
    }
  })

  it('returns ok:false with 400 when a required field is missing', () => {
    const result = parsePayload<{ name: string; email: string }>(
      { name: 'Alice' },
      ['name', 'email'],
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.err.statusCode).toBe(400)
      expect(JSON.parse(result.err.body as string)).toEqual({ error: 'email is required' })
    }
  })

  it('returns ok:false when a required field is null', () => {
    const result = parsePayload<{ name: string }>(
      { name: null },
      ['name'],
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.err.statusCode).toBe(400)
    }
  })

  it('returns ok:false when a required field is empty string (falsy)', () => {
    const result = parsePayload<{ name: string }>(
      { name: '' },
      ['name'],
    )
    expect(result.ok).toBe(false)
  })

  it('returns ok:false when a required field is false', () => {
    const result = parsePayload<{ accepted: boolean }>(
      { accepted: false },
      ['accepted'],
    )
    expect(result.ok).toBe(false)
  })

  it('returns ok:true with no required fields', () => {
    const result = parsePayload<Record<string, never>>({}, [])
    expect(result.ok).toBe(true)
  })

  it('reports the first missing field in the error', () => {
    const result = parsePayload<{ a: string; b: string; c: string }>(
      {},
      ['a', 'b', 'c'],
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(JSON.parse(result.err.body as string).error).toBe('a is required')
    }
  })
})

describe('newItem', () => {
  it('returns an object with id, status:pending, and createdAt', () => {
    const item = newItem()
    expect(item).toHaveProperty('id')
    expect(item.status).toBe('pending')
    expect(item).toHaveProperty('createdAt')
  })

  it('id is a valid UUID string', () => {
    const { id } = newItem()
    expect(typeof id).toBe('string')
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('generates unique ids on each call', () => {
    const ids = Array.from({ length: 5 }, () => newItem().id)
    expect(new Set(ids).size).toBe(5)
  })

  it('createdAt is an ISO timestamp', () => {
    const { createdAt } = newItem()
    expect(new Date(createdAt).toISOString()).toBe(createdAt)
  })
})

describe('sendEmail', () => {
  beforeEach(() => {
    mockSESSend.mockReset()
  })

  it('calls SES send once with a subject and body', async () => {
    mockSESSend.mockResolvedValueOnce({})
    await sendEmail('Test Subject', 'Test body text')
    expect(mockSESSend).toHaveBeenCalledOnce()
  })

  it('does not throw when SES send fails (non-fatal)', async () => {
    mockSESSend.mockRejectedValueOnce(new Error('SES unavailable'))
    await expect(sendEmail('Fail subject', 'body')).resolves.toBeUndefined()
  })
})
