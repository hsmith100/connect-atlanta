import * as api from './adminLibrary'

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
  ['getPhotoCollections', () => api.getPhotoCollections(KEY), 'GET', '/api/admin/library/collections', { collections: [{ id: 'c' }] }, [{ id: 'c' }]],
  ['createPhotoCollection', () => api.createPhotoCollection(KEY, { eventId: 'e', defaultPriceCents: 1500 }), 'POST', '/api/admin/library/collections', { id: 'c' }, { id: 'c' }],
  ['updatePhotoCollection', () => api.updatePhotoCollection(KEY, 'c/1', { status: 'published' }), 'PATCH', '/api/admin/library/collections/c%2F1', { id: 'c' }, { id: 'c' }],
  ['deletePhotoCollection', () => api.deletePhotoCollection(KEY, 'c'), 'DELETE', '/api/admin/library/collections/c', { deleted: true }, undefined],
  ['getCollectionPhotos', () => api.getCollectionPhotos(KEY, 'c'), 'GET', '/api/admin/library/collections/c/photos', { photos: [{ id: 'x' }] }, [{ id: 'x' }]],
  ['getGalleryPhotos', () => api.getGalleryPhotos(KEY), 'GET', '/api/admin/library/gallery', { photos: [{ id: 'g' }] }, [{ id: 'g' }]],
  ['presignLibraryPhotos', () => api.presignLibraryPhotos(KEY, []), 'POST', '/api/admin/library/photos/presign', [{ id: 'x' }], [{ id: 'x' }]],
  ['createLibraryPhotos', () => api.createLibraryPhotos(KEY, []), 'POST', '/api/admin/library/photos', { created: 0 }, undefined],
  ['updateLibraryPhotos', () => api.updateLibraryPhotos(KEY, []), 'PATCH', '/api/admin/library/photos', { updated: 0 }, undefined],
  ['deleteLibraryPhotos', () => api.deleteLibraryPhotos(KEY, ['x']), 'DELETE', '/api/admin/library/photos', { deleted: 1, skipped: [] }, { deleted: 1, skipped: [] }],
  ['presignReplace', () => api.presignReplace(KEY, 'x', { filename: 'a.jpg', contentType: 'image/jpeg', bytes: 1 }), 'POST', '/api/admin/library/photos/x/replace', { id: 'x' }, { id: 'x' }],
  ['completeReplace', () => api.completeReplace(KEY, 'x', {} as never), 'PATCH', '/api/admin/library/photos/x/replace', { id: 'x' }, { id: 'x' }],
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
  await api.deleteLibraryPhotos(KEY, ['a', 'b'])
  expect(lastCall()[1].body).toBe(JSON.stringify({ ids: ['a', 'b'] }))

  respond({ collections: [] })
  await api.getPhotoCollections(KEY)
  expect(lastCall()[1].body).toBeUndefined()
})
