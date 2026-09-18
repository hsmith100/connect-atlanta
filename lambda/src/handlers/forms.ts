import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { errResponse, parseBody } from '../lib/formShared';
import { FORM_ROUTES } from './formSubmissions';
import { listArtists, listSponsors, updateSponsorNotes, listEmailSignups } from './adminSubmissions';
import { verifyTurnstileToken, isTurnstileEnforced } from '../lib/turnstile';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // Admin submission routes
    if (method === 'GET'  && path === '/api/admin/submissions/artists')       return listArtists(event);
    if (method === 'GET'  && path === '/api/admin/submissions/sponsors')      return listSponsors(event);
    if (method === 'GET'  && path === '/api/admin/submissions/email-signups') return listEmailSignups(event);

    const sponsorIdMatch = path.match(/^\/api\/admin\/submissions\/sponsors\/([^/]+)$/);
    if (method === 'PATCH' && sponsorIdMatch) return updateSponsorNotes(event, sponsorIdMatch[1]);

    // Public form submission routes
    if (method === 'POST' && path.startsWith('/api/forms/')) {
      const formType = path.replace('/api/forms/', '');
      const route = FORM_ROUTES[formType];
      if (!route) return errResponse(404, `Unknown form type: ${formType}`);
      const data = parseBody(event);

      const isValid = await verifyTurnstileToken(data.turnstileToken, event.requestContext.http.sourceIp);
      if (!isValid) {
        console.warn(`Turnstile verification failed for ${formType} (enforced=${isTurnstileEnforced()})`);
        if (isTurnstileEnforced()) return errResponse(403, 'Verification failed. Please refresh and try again.');
      }

      return route(data);
    }

    return errResponse(404, 'Not found');
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    console.error('Forms handler error:', e);
    if (message === 'Missing request body' || message === 'Invalid JSON body') {
      return errResponse(400, message);
    }
    return errResponse(500, 'Internal server error');
  }
};
