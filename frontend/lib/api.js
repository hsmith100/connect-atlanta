// API client — all requests go to /api/* which CloudFront proxies to API Gateway.
// In local dev, NEXT_PUBLIC_API_URL points to the staging API Gateway URL.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getEvents() {
  return fetchAPI('/api/events');
}

export async function getEvent(eventId) {
  return fetchAPI(`/api/events/${eventId}`);
}

// Gallery endpoints — implemented in Phase 5 (S3 photo migration)
export async function getGallery() {
  return fetchAPI('/api/gallery');
}

export async function getEventGallery(eventId) {
  return fetchAPI(`/api/events/${eventId}/gallery`);
}

export async function submitForm(formType, data) {
  return fetchAPI(`/api/forms/${formType}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
