import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { errResponse } from '../lib/photoShared';
import { listPhotographers, createPhotographer, updatePhotographer } from './adminStorePhotographers';
import {
  listCollections, createCollection, updateCollection, deleteCollection, listCollectionPhotos, listGalleryPhotos,
  presignLibraryPhotos, createLibraryPhotos, updateLibraryPhotos, deleteLibraryPhotos, presignReplace, completeReplace,
} from './adminLibrary';

// Thin router for /api/store/* (public store), /api/admin/library/* (photo library)
// and /api/admin/store/* (selling: photographers, orders, settings).
// Handlers are awaited inside the try so a rejected promise becomes a JSON 500, not a bare 502.
// Business logic lives in storePublic.ts, storeCheckout.ts, adminLibrary.ts,
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

    if (method === 'GET'    && path === '/api/admin/library/collections')         return await listCollections(event);
    if (method === 'POST'   && path === '/api/admin/library/collections')         return await createCollection(event);
    if ((m = path.match(/^\/api\/admin\/library\/collections\/([^/]+)\/photos$/))) {
      if (method === 'GET') return await listCollectionPhotos(event, m[1]);
    }
    if ((m = path.match(/^\/api\/admin\/library\/collections\/([^/]+)$/))) {
      if (method === 'PATCH')  return await updateCollection(event, m[1]);
      if (method === 'DELETE') return await deleteCollection(event, m[1]);
    }

    if (method === 'GET'    && path === '/api/admin/library/gallery')             return await listGalleryPhotos(event);
    if (method === 'POST'   && path === '/api/admin/library/photos/presign')      return await presignLibraryPhotos(event);
    if (method === 'POST'   && path === '/api/admin/library/photos')              return await createLibraryPhotos(event);
    if (method === 'PATCH'  && path === '/api/admin/library/photos')              return await updateLibraryPhotos(event);
    if (method === 'DELETE' && path === '/api/admin/library/photos')              return await deleteLibraryPhotos(event);
    if ((m = path.match(/^\/api\/admin\/library\/photos\/([^/]+)\/replace$/))) {
      if (method === 'POST')  return await presignReplace(event, m[1]);
      if (method === 'PATCH') return await completeReplace(event, m[1]);
    }

    return errResponse(404, 'Not found');
  } catch (e) {
    console.error('Store handler error:', e);
    return errResponse(500, 'Internal server error');
  }
};
