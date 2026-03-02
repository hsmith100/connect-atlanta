/**
 * API client for backend communication
 * Handles all HTTP requests to the FastAPI backend
 */

// Use relative URLs in production for Next.js proxy, absolute URLs in dev
const API_BASE_URL = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
  ? '' // Use relative URLs in production (browser), Next.js will proxy via rewrites
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Get list of all events
 * @returns {Promise<Array>} Array of event objects
 */
export async function getEvents() {
  return fetchAPI('/api/events');
}

/**
 * Get details for a specific event
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Event details
 */
export async function getEvent(eventId) {
  return fetchAPI(`/api/events/${eventId}`);
}

/**
 * Get gallery (photos and videos) for a specific event
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Gallery data with photos and videos
 */
export async function getEventGallery(eventId) {
  return fetchAPI(`/api/events/${eventId}/gallery`);
}

/**
 * Get all gallery photos and videos from main events/photos folder
 * @returns {Promise<Object>} Gallery data with photos and videos
 */
export async function getGallery() {
  return fetchAPI('/api/gallery');
}

/**
 * Test Cloudinary connection
 * @returns {Promise<Object>} Connection status
 */
export async function testCloudinaryConnection() {
  return fetchAPI('/api/events/test/cloudinary');
}

/**
 * Health check endpoint
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
  return fetchAPI('/health');
}

