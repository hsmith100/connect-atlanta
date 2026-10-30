import { getPublicCollections, getPublicCollectionPage } from './store'

function respond(body: unknown) {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve(body) })
}

beforeEach(() => {
  global.fetch = jest.fn()
})

it('getPublicCollections returns the collections list', async () => {
  respond({ collections: [{ id: 'c1' }] })
  await expect(getPublicCollections()).resolves.toEqual([{ id: 'c1' }])
  expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/store/collections')
})

it('getPublicCollectionPage requests the first page without a cursor', async () => {
  respond({ photos: [], nextCursor: null })
  await getPublicCollectionPage('c/1')
  expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/store/collections/c%2F1')
})

it('getPublicCollectionPage passes an encoded cursor', async () => {
  respond({ photos: [], nextCursor: null })
  await getPublicCollectionPage('c1', 'ab+c=')
  expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/store/collections/c1?cursor=ab%2Bc%3D')
})
