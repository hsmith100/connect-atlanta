# Forms API Documentation

## Overview
This API handles all form submissions for the Connect Events website, including email signups, vendor applications, volunteer applications, and artist/DJ applications.

## Base URL
```
http://localhost:8000/api/forms (development)
http://98.81.74.242:8000/api/forms (production)
```

## Endpoints

### 1. Email Signup (Let's Connect Form)
**POST** `/api/forms/email-signup`

Submit email signup from the Let's Connect form on the homepage.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "marketing_consent": true,
  "source": "website"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Thank you for signing up! We'll keep you updated on upcoming events.",
  "id": 123,
  "created_at": "2025-12-24T12:00:00"
}
```

**Error Response (409 Conflict):**
```json
{
  "detail": "This email is already registered."
}
```

---

### 2. Vendor Application
**POST** `/api/forms/vendor-application`

Submit a vendor application to participate in events.

**Request Body:**
```json
{
  "business_name": "Food Truck Name",
  "contact_name": "Jane Smith",
  "email": "jane@foodtruck.com",
  "phone": "555-5678",
  "business_type": "Food Vendor",
  "description": "We serve amazing tacos!",
  "website": "https://foodtruck.com",
  "instagram": "@foodtruck",
  "previous_experience": "10+ festivals and events"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Thank you for your vendor application! We'll review it and get back to you soon.",
  "id": 456,
  "created_at": "2025-12-24T12:00:00"
}
```

---

### 3. Volunteer Application
**POST** `/api/forms/volunteer-application`

Submit a volunteer application.

**Request Body:**
```json
{
  "name": "Mike Johnson",
  "email": "mike@example.com",
  "phone": "555-9012",
  "availability": "Weekends",
  "skills": "Event setup, crowd management",
  "previous_experience": "Volunteered at Music Midtown 2023",
  "why_volunteer": "Love supporting local music!",
  "emergency_contact_name": "Sarah Johnson",
  "emergency_contact_phone": "555-3456"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Thank you for volunteering! We'll be in touch with next steps.",
  "id": 789,
  "created_at": "2025-12-24T12:00:00"
}
```

---

### 4. Artist/DJ Application
**POST** `/api/forms/artist-application`

Submit an artist or DJ application to perform at events.

**Request Body:**
```json
{
  "artist_name": "DJ Awesome",
  "real_name": "Alex Martinez",
  "email": "alex@djawesome.com",
  "phone": "555-7890",
  "genre": "Electronic",
  "subgenres": "House, Techno, Trance",
  "experience_years": 5,
  "bio": "Atlanta-based DJ with 5 years experience...",
  "soundcloud": "https://soundcloud.com/djawesome",
  "spotify": "https://open.spotify.com/artist/...",
  "instagram": "@djawesome",
  "facebook": "facebook.com/djawesome",
  "youtube": "youtube.com/@djawesome",
  "mixcloud": "mixcloud.com/djawesome",
  "website": "https://djawesome.com",
  "equipment_owned": "Pioneer DDJ-1000, CDJ-3000s",
  "past_performances": "Opera Nightclub, Ravine...",
  "references": "Available upon request"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Thank you for your artist application! We'll review your submission and contact you soon.",
  "id": 1011,
  "created_at": "2025-12-24T12:00:00"
}
```

---

### 5. Health Check
**GET** `/api/forms/health`

Check the health status of the forms API.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "forms_api",
  "endpoints": {
    "email_signup": "/api/forms/email-signup",
    "vendor_application": "/api/forms/vendor-application",
    "volunteer_application": "/api/forms/volunteer-application",
    "artist_application": "/api/forms/artist-application"
  }
}
```

---

## Database Tables

### email_signups
Stores email signup submissions from the Let's Connect form.

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Full name |
| email | VARCHAR(255) | Email (unique) |
| phone | VARCHAR(50) | Phone number (optional) |
| marketing_consent | BOOLEAN | Opted in for marketing |
| source | VARCHAR(50) | Signup source (default: 'website') |
| created_at | TIMESTAMP | Signup timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### vendor_applications
Stores vendor application submissions.

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| business_name | VARCHAR(255) | Business name |
| contact_name | VARCHAR(255) | Contact person name |
| email | VARCHAR(255) | Contact email |
| phone | VARCHAR(50) | Contact phone |
| business_type | VARCHAR(100) | Type of business |
| description | TEXT | Business description |
| website | VARCHAR(255) | Website URL |
| instagram | VARCHAR(255) | Instagram handle |
| previous_experience | TEXT | Previous event experience |
| status | VARCHAR(50) | Application status (default: 'pending') |
| notes | TEXT | Admin notes |
| created_at | TIMESTAMP | Application timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### volunteer_applications
Stores volunteer application submissions.

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Full name |
| email | VARCHAR(255) | Email |
| phone | VARCHAR(50) | Phone number |
| availability | TEXT | Availability schedule |
| skills | TEXT | Relevant skills |
| previous_experience | TEXT | Previous volunteer experience |
| why_volunteer | TEXT | Motivation for volunteering |
| emergency_contact_name | VARCHAR(255) | Emergency contact name |
| emergency_contact_phone | VARCHAR(50) | Emergency contact phone |
| status | VARCHAR(50) | Application status (default: 'pending') |
| notes | TEXT | Admin notes |
| created_at | TIMESTAMP | Application timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### artist_applications
Stores artist/DJ application submissions.

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| artist_name | VARCHAR(255) | Stage/artist name |
| real_name | VARCHAR(255) | Real name |
| email | VARCHAR(255) | Email |
| phone | VARCHAR(50) | Phone number |
| genre | VARCHAR(100) | Primary genre |
| subgenres | TEXT | Subgenres/styles |
| experience_years | INTEGER | Years of experience |
| bio | TEXT | Artist bio |
| soundcloud | VARCHAR(255) | SoundCloud profile |
| spotify | VARCHAR(255) | Spotify profile |
| instagram | VARCHAR(255) | Instagram handle |
| facebook | VARCHAR(255) | Facebook page |
| youtube | VARCHAR(255) | YouTube channel |
| mixcloud | VARCHAR(255) | Mixcloud profile |
| website | VARCHAR(255) | Personal website |
| equipment_owned | TEXT | Equipment owned |
| past_performances | TEXT | Past performance venues/events |
| references | TEXT | References |
| status | VARCHAR(50) | Application status (default: 'pending') |
| notes | TEXT | Admin notes |
| created_at | TIMESTAMP | Application timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

---

## Error Codes

| Code | Description |
|------|-------------|
| 201 | Created - Form submitted successfully |
| 400 | Bad Request - Invalid data provided |
| 409 | Conflict - Duplicate entry (email already exists) |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error occurred |

---

## Frontend Integration Example

```javascript
// Email Signup Form
async function submitEmailSignup(formData) {
  try {
    const response = await fetch('http://98.81.74.242:8000/api/forms/email-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        marketing_consent: formData.marketingConsent,
        source: 'website'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Success!
      alert(data.message);
    } else {
      // Error
      alert(data.detail || 'An error occurred');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to submit form');
  }
}
```

---

## Notes
- All timestamps are in ISO 8601 format
- Email fields use validation to ensure proper format
- Required fields are marked with `...` in the Pydantic models
- All applications default to 'pending' status for admin review
- Email signups enforce unique email constraint
- Phone numbers are stored as strings to accommodate various formats

