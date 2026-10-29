import * as api from './adminStore'

const KEY = 'k'

function respond(body: unknown) {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve(body) })
}

function lastCall(): [string, RequestInit] {
  const calls = (global.fetch as jest.Mock).mock.calls
  return calls[calls.length - 1]
}

beforeEach(() => {
  global.fetch = jest.fn()
})

it.each([
  ['getPhotographers', () => api.getPhotographers(KEY), 'GET', '/api/admin/store/photographers', { photographers: [{ id: 'p' }] }, [{ id: 'p' }]],
  ['createPhotographer', () => api.createPhotographer(KEY, { name: 'A', email: 'a@b.com', commissionPct: 40 }), 'POST', '/api/admin/store/photographers', { id: 'p' }, { id: 'p' }],
  ['updatePhotographer', () => api.updatePhotographer(KEY, 'p/1', { active: false }), 'PATCH', '/api/admin/store/photographers/p%2F1', { id: 'p' }, { id: 'p' }],
] as const)('%s calls %s %s with the admin key', async (_name, call, method, url, response, expected) => {
  respond(response)
  await expect(call()).resolves.toEqual(expected)
  const [calledUrl, init] = lastCall()
  expect(calledUrl).toBe(url)
  expect(init.method).toBe(method)
  expect(init.headers).toMatchObject({ 'x-admin-key': KEY })
})

it('sends JSON bodies for writes and none for reads', async () => {
  respond({ id: 'p' })
  await api.updatePhotographer(KEY, 'p', { active: false })
  expect(lastCall()[1].body).toBe(JSON.stringify({ active: false }))

  respond({ photographers: [] })
  await api.getPhotographers(KEY)
  expect(lastCall()[1].body).toBeUndefined()
})
