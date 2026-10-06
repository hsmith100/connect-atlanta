import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from './store';
import * as photographers from './adminStorePhotographers';
import * as catalog from './adminStoreCatalog';

jest.mock('./adminStorePhotographers');
jest.mock('./adminStoreCatalog');

const OK = { statusCode: 200, body: '{}' };

function makeEvent(method: string, path: string): APIGatewayProxyEventV2 {
  return { rawPath: path, requestContext: { http: { method } }, headers: {} } as unknown as APIGatewayProxyEventV2;
}

beforeEach(() => {
  jest.resetAllMocks();
  for (const mod of [photographers, catalog]) {
    for (const fn of Object.values(mod)) {
      if (jest.isMockFunction(fn)) fn.mockResolvedValue(OK);
    }
  }
});

describe('store router', () => {
  it.each([
    ['GET', '/api/admin/store/photographers', photographers.listPhotographers, []],
    ['POST', '/api/admin/store/photographers', photographers.createPhotographer, []],
    ['PATCH', '/api/admin/store/photographers/p1', photographers.updatePhotographer, ['p1']],
    ['GET', '/api/admin/store/collections', catalog.listCollections, []],
    ['POST', '/api/admin/store/collections', catalog.createCollection, []],
    ['PATCH', '/api/admin/store/collections/c1', catalog.updateCollection, ['c1']],
    ['DELETE', '/api/admin/store/collections/c1', catalog.deleteCollection, ['c1']],
    ['GET', '/api/admin/store/collections/c1/photos', catalog.listCollectionPhotos, ['c1']],
    ['POST', '/api/admin/store/photos/presign', catalog.presignStorePhotos, []],
    ['POST', '/api/admin/store/photos', catalog.createStorePhotos, []],
    ['PATCH', '/api/admin/store/photos', catalog.updateStorePhotos, []],
    ['DELETE', '/api/admin/store/photos', catalog.deleteStorePhotos, []],
    ['POST', '/api/admin/store/photos/x1/replace', catalog.presignReplace, ['x1']],
    ['PATCH', '/api/admin/store/photos/x1/replace', catalog.completeReplace, ['x1']],
  ] as const)('%s %s routes to its handler', async (method, path, fn, args) => {
    const event = makeEvent(method, path);
    await handler(event);
    expect(fn).toHaveBeenCalledWith(event, ...args);
  });

  it.each([
    ['GET', '/api/store/nope'],
    ['DELETE', '/api/admin/store/photographers/p1'],
    ['GET', '/api/admin/store/collections/c1/photos/extra'],
    ['PUT', '/api/admin/store/photos'],
  ])('returns a JSON 404 for %s %s', async (method, path) => {
    const res = await handler(makeEvent(method, path)) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'Not found' });
  });

  it('returns 500 and logs when a handler throws', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(catalog.listCollections).mockRejectedValue(new Error('boom'));
    const res = await handler(makeEvent('GET', '/api/admin/store/collections')) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(500);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
