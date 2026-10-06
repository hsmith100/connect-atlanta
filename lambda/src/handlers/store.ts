import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { errResponse } from '../lib/photoShared';
import { listPhotographers, createPhotographer, updatePhotographer } from './adminStorePhotographers';
import {
  listCollections, createCollection, updateCollection, deleteCollection, listCollectionPhotos,
  presignStorePhotos, createStorePhotos, updateStorePhotos, deleteStorePhotos, presignReplace, completeReplace,
} from './adminStoreCatalog';

// Thin router for /api/store/* (public) and /api/admin/store/* (admin).
// Handlers are awaited inside the try so a rejected promise becomes a JSON 500, not a bare 502.
// Business logic lives in storePublic.ts, storeCheckout.ts, adminStoreCatalog.ts,
// adminStoreOrders.ts and adminStorePhotographers.ts.
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    let m: RegExpMatchArray | null;

    if (method === 'GET'    && path === '/api/admin/store/photographers')         return await listPhotographers(event);
    if (method === 'POST'   && path === '/api/admin/store/photographers')         return await createPhotographer(event);
    if ((m = path.match(/^\/api\/admin\/store\/photographers\/([^/]+)$/))) {
      if (method === 'PATCH') return await updatePhotographer(event, m[1]);
    }

    if (method === 'GET'    && path === '/api/admin/store/collections')           return await listCollections(event);
    if (method === 'POST'   && path === '/api/admin/store/collections')           return await createCollection(event);
    if ((m = path.match(/^\/api\/admin\/store\/collections\/([^/]+)\/photos$/))) {
      if (method === 'GET') return await listCollectionPhotos(event, m[1]);
    }
    if ((m = path.match(/^\/api\/admin\/store\/collections\/([^/]+)$/))) {
      if (method === 'PATCH')  return await updateCollection(event, m[1]);
      if (method === 'DELETE') return await deleteCollection(event, m[1]);
    }

    if (method === 'POST'   && path === '/api/admin/store/photos/presign')        return await presignStorePhotos(event);
    if (method === 'POST'   && path === '/api/admin/store/photos')                return await createStorePhotos(event);
    if (method === 'PATCH'  && path === '/api/admin/store/photos')                return await updateStorePhotos(event);
    if (method === 'DELETE' && path === '/api/admin/store/photos')                return await deleteStorePhotos(event);
    if ((m = path.match(/^\/api\/admin\/store\/photos\/([^/]+)\/replace$/))) {
      if (method === 'POST')  return await presignReplace(event, m[1]);
      if (method === 'PATCH') return await completeReplace(event, m[1]);
    }

    return errResponse(404, 'Not found');
  } catch (e) {
    console.error('Store handler error:', e);
    return errResponse(500, 'Internal server error');
  }
};
