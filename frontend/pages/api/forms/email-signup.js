// API Route: Email Signup Proxy
// This route proxies requests from the frontend to the backend API
// to avoid CORS issues and keep the backend URL internal

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward the request to the backend API
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8000';
    const response = await fetch(`${backendUrl}/api/forms/email-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // Get the response data
    const data = await response.json();

    // Return the backend response to the frontend
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Email signup proxy error:', error);
    return res.status(500).json({ 
      error: 'Failed to submit form',
      details: error.message 
    });
  }
}
