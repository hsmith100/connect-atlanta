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
  ['getStoreCollections', () => api.getStoreCollections(KEY), 'GET', '/api/admin/store/collections', { collections: [{ id: 'c' }] }, [{ id: 'c' }]],
  ['createStoreCollection', () => api.createStoreCollection(KEY, { eventId: 'e', defaultPriceCents: 1500 }), 'POST', '/api/admin/store/collections', { id: 'c' }, { id: 'c' }],
  ['updateStoreCollection', () => api.updateStoreCollection(KEY, 'c', { status: 'published' }), 'PATCH', '/api/admin/store/collections/c', { id: 'c' }, { id: 'c' }],
  ['deleteStoreCollection', () => api.deleteStoreCollection(KEY, 'c'), 'DELETE', '/api/admin/store/collections/c', { deleted: true }, undefined],
  ['getCollectionPhotos', () => api.getCollectionPhotos(KEY, 'c'), 'GET', '/api/admin/store/collections/c/photos', { photos: [{ id: 'x' }] }, [{ id: 'x' }]],
  ['presignStorePhotos', () => api.presignStorePhotos(KEY, []), 'POST', '/api/admin/store/photos/presign', [{ id: 'x' }], [{ id: 'x' }]],
  ['createStorePhotos', () => api.createStorePhotos(KEY, []), 'POST', '/api/admin/store/photos', { created: 0 }, undefined],
  ['updateStorePhotos', () => api.updateStorePhotos(KEY, []), 'PATCH', '/api/admin/store/photos', { updated: 0 }, undefined],
  ['deleteStorePhotos', () => api.deleteStorePhotos(KEY, ['x']), 'DELETE', '/api/admin/store/photos', { deleted: 1, skipped: [] }, { deleted: 1, skipped: [] }],
  ['presignReplace', () => api.presignReplace(KEY, 'x', { filename: 'a.jpg', contentType: 'image/jpeg', bytes: 1 }), 'POST', '/api/admin/store/photos/x/replace', { id: 'x' }, { id: 'x' }],
  ['completeReplace', () => api.completeReplace(KEY, 'x', {} as never), 'PATCH', '/api/admin/store/photos/x/replace', { id: 'x' }, { id: 'x' }],
] as const)('%s calls %s %s with the admin key', async (_name, call, method, url, response, expected) => {
  respond(response)
  await expect(call()).resolves.toEqual(expected)
  const [calledUrl, init] = lastCall()
  expect(calledUrl).toBe(url)
  expect(init.method).toBe(method)
  expect(init.headers).toMatchObject({ 'x-admin-key': KEY })
})

it('sends JSON bodies for writes and none for reads', async () => {
  respond({ deleted: 1, skipped: [] })
  await api.deleteStorePhotos(KEY, ['a', 'b'])
  expect(lastCall()[1].body).toBe(JSON.stringify({ ids: ['a', 'b'] }))

  respond({ collections: [] })
  await api.getStoreCollections(KEY)
  expect(lastCall()[1].body).toBeUndefined()
})
