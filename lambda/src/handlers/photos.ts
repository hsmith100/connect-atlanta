import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { errResponse } from '../lib/photoShared';
import { getGallery } from './gallery';
import { listAllPhotos, presignUpload, createPhotos, updatePhotos, deletePhotos } from './adminPhotos';
import { listAdminEvents, createEvent, presignFlyer, updateEventFlyer, deleteEventById } from './adminEvents';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;

    if (method === 'GET'    && path === '/api/gallery')                  return getGallery(event);
    if (method === 'GET'    && path === '/api/admin/photos')              return listAllPhotos(event);
    if (method === 'POST'   && path === '/api/admin/photos/presign')      return presignUpload(event);
    if (method === 'POST'   && path === '/api/admin/photos')              return createPhotos(event);
    if (method === 'PATCH'  && path === '/api/admin/photos')              return updatePhotos(event);
    if (method === 'DELETE' && path === '/api/admin/photos')              return deletePhotos(event);
    if (method === 'GET'    && path === '/api/admin/events')              return listAdminEvents(event);
    if (method === 'POST'   && path === '/api/admin/events')              return createEvent(event);
    if (method === 'POST'   && path === '/api/admin/flyers/presign')      return presignFlyer(event);

    const eventIdMatch = path.match(/^\/api\/admin\/events\/([^/]+)$/);
    if (method === 'PATCH'  && eventIdMatch) return updateEventFlyer(event);
    if (method === 'DELETE' && eventIdMatch) return deleteEventById(event);

    return errResponse(404, 'Not found');
  } catch (e) {
    console.error('Photos handler error:', e);
    return errResponse(500, 'Internal server error');
  }
};
