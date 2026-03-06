import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchAPI, adminHeaders } from '../../../lib/api/client'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function makeResponse(ok: boolean, status: number, body: unknown): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

describe('fetchAPI', () => {
  it('returns parsed JSON on a successful response', async () => {
    const data = { events: [{ id: '1', title: 'Test' }] }
    mockFetch.mockResolvedValueOnce(makeResponse(true, 200, data))
    const result = await fetchAPI<typeof data>('/api/events')
    expect(result).toEqual(data)
  })

  it('calls fetch with the provided endpoint URL', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(true, 200, {}))
    await fetchAPI('/api/events')
    expect(mockFetch).toHaveBeenCalledWith('/api/events', expect.any(Object))
  })

  it('includes Content-Type: application/json header by default', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(true, 200, {}))
    await fetchAPI('/api/events')
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('merges caller-provided headers with the default headers', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(true, 200, {}))
    await fetchAPI('/api/events', { headers: { 'x-admin-key': 'secret' } })
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = options.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['x-admin-key']).toBe('secret')
  })

  it('throws with the server error message on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(false, 400, { error: 'email is required' }))
    await expect(fetchAPI('/api/forms/email-signup')).rejects.toThrow('email is required')
  })

  it('throws with HTTP status fallback when error body has no message', async () => {
    const response = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('not json')),
    } as unknown as Response
    mockFetch.mockResolvedValueOnce(response)
    await expect(fetchAPI('/api/something')).rejects.toThrow('HTTP 500')
  })

  it('throws with HTTP status when error body is empty object', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(false, 404, {}))
    await expect(fetchAPI('/api/missing')).rejects.toThrow('HTTP 404')
  })

  it('passes additional request options through to fetch', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(true, 200, {}))
    await fetchAPI('/api/forms/email-signup', { method: 'POST', body: '{"name":"Alice"}' })
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(options.method).toBe('POST')
    expect(options.body).toBe('{"name":"Alice"}')
  })
})

describe('adminHeaders', () => {
  it('returns an object with the x-admin-key header', () => {
    const headers = adminHeaders('my-secret-key')
    expect(headers).toEqual({ 'x-admin-key': 'my-secret-key' })
  })

  it('uses the exact key string provided', () => {
    const key = 'abc-123-xyz'
    const headers = adminHeaders(key)
    expect(headers['x-admin-key']).toBe(key)
  })
})
