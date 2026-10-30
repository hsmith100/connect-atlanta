import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from './store';
import * as photographers from './adminStorePhotographers';
import * as library from './adminLibrary';
import * as storePublic from './storePublic';

jest.mock('./adminStorePhotographers');
jest.mock('./adminLibrary');
jest.mock('./storePublic');

const OK = { statusCode: 200, body: '{}' };

function makeEvent(method: string, path: string): APIGatewayProxyEventV2 {
  return { rawPath: path, requestContext: { http: { method } }, headers: {} } as unknown as APIGatewayProxyEventV2;
}

beforeEach(() => {
  jest.resetAllMocks();
  for (const mod of [photographers, library, storePublic]) {
    for (const fn of Object.values(mod)) {
      if (jest.isMockFunction(fn)) fn.mockResolvedValue(OK);
    }
  }
});

describe('store router', () => {
  it.each([
    ['GET', '/api/store/collections/c1', storePublic.getPublicCollectionPage, ['c1']],
    ['GET', '/api/admin/store/photographers', photographers.listPhotographers, []],
    ['POST', '/api/admin/store/photographers', photographers.createPhotographer, []],
    ['PATCH', '/api/admin/store/photographers/p1', photographers.updatePhotographer, ['p1']],
    ['GET', '/api/admin/library/collections', library.listCollections, []],
    ['POST', '/api/admin/library/collections', library.createCollection, []],
    ['PATCH', '/api/admin/library/collections/c1', library.updateCollection, ['c1']],
    ['DELETE', '/api/admin/library/collections/c1', library.deleteCollection, ['c1']],
    ['GET', '/api/admin/library/collections/c1/photos', library.listCollectionPhotos, ['c1']],
    ['GET', '/api/admin/library/gallery', library.listGalleryPhotos, []],
    ['POST', '/api/admin/library/photos/presign', library.presignLibraryPhotos, []],
    ['POST', '/api/admin/library/photos', library.createLibraryPhotos, []],
    ['PATCH', '/api/admin/library/photos', library.updateLibraryPhotos, []],
    ['DELETE', '/api/admin/library/photos', library.deleteLibraryPhotos, []],
    ['POST', '/api/admin/library/photos/x1/replace', library.presignReplace, ['x1']],
    ['PATCH', '/api/admin/library/photos/x1/replace', library.completeReplace, ['x1']],
  ] as const)('%s %s routes to its handler', async (method, path, fn, args) => {
    const event = makeEvent(method, path);
    await handler(event);
    expect(fn).toHaveBeenCalledWith(event, ...args);
  });

  it.each([
    ['GET', '/api/store/nope'],
    ['POST', '/api/store/collections'],
    ['DELETE', '/api/admin/store/photographers/p1'],
    ['GET', '/api/admin/library/collections/c1/photos/extra'],
    ['PUT', '/api/admin/library/photos'],
    ['GET', '/api/admin/store/collections'],
  ])('returns a JSON 404 for %s %s', async (method, path) => {
    const res = await handler(makeEvent(method, path)) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'Not found' });
  });

  it('routes GET /api/store/collections to listPublicCollections', async () => {
    await handler(makeEvent('GET', '/api/store/collections'));
    expect(storePublic.listPublicCollections).toHaveBeenCalled();
  });

  it('returns 500 and logs when a handler throws', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(library.listCollections).mockRejectedValue(new Error('boom'));
    const res = await handler(makeEvent('GET', '/api/admin/library/collections')) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(500);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
