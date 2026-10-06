import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from './store';

function makeEvent(method: string, path: string): APIGatewayProxyEventV2 {
  return { rawPath: path, requestContext: { http: { method } }, headers: {} } as unknown as APIGatewayProxyEventV2;
}

describe('store router', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await handler(makeEvent('GET', '/api/store/nope')) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'Not found' });
  });
});
