import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { errResponse } from '../lib/photoShared';

// Thin router for /api/store/* (public) and /api/admin/store/* (admin).
// Each user story registers its routes here; business logic lives in storePublic.ts,
// storeCheckout.ts, adminStoreCatalog.ts, adminStoreOrders.ts and adminStorePhotographers.ts.
export const handler = async (_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    return errResponse(404, 'Not found');
  } catch (e) {
    console.error('Store handler error:', e);
    return errResponse(500, 'Internal server error');
  }
};
