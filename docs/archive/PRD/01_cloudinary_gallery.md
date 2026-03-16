# PRD: Cloudinary Gallery Integration

**Project:** Beats on the Beltline - Dynamic Event Gallery System  
**Date:** November 11, 2025  
**Status:** Planning  
**Priority:** High  

---

## Executive Summary

Implement a scalable, client-manageable event gallery system using Cloudinary as the media hosting and management platform. This will enable the client to independently upload, organize, and manage event photos/videos while providing website visitors with an optimized, fast-loading gallery experience.

### Key Objectives
1. Enable client self-service media management
2. Provide dynamic, event-specific galleries on the website
3. Optimize media delivery for web performance
4. Scale efficiently with growing media library
5. Minimize ongoing developer maintenance

---

## Problem Statement

### Current State
- **Static Gallery:** Event photos are hardcoded in the codebase
- **Manual Updates:** Developer intervention required for every new photo
- **No Scalability:** Can't efficiently handle "tons of images and videos"
- **Limited Client Control:** Client has no way to manage media themselves
- **No Optimization:** Images served at full size, impacting performance

### Challenges
- Events generate hundreds of high-resolution photos
- Videos require transcoding for web delivery
- Client needs to update galleries quickly after events
- Current approach doesn't scale beyond a few events
- Page load times will degrade with more media

---

## Proposed Solution

### Future State
- **Dynamic Gallery:** Photos fetched from Cloudinary API in real-time
- **Client Self-Service:** Client manages all media via Cloudinary dashboard
- **Auto-Optimization:** Images automatically resized, compressed, and delivered via CDN
- **Video Support:** Automatic transcoding and adaptive streaming
- **Organized Structure:** Media organized by event, easily browsable

### Benefits
- ✅ Client independence (no developer needed for media updates)
- ✅ Unlimited scalability (add as many events/photos as needed)
- ✅ Faster page loads (CDN + optimization)
- ✅ Professional media management interface
- ✅ Lower maintenance costs
- ✅ Better mobile experience
- ✅ Video support out of the box

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT WORKFLOW                         │
├─────────────────────────────────────────────────────────────┤
│  1. Client logs into Cloudinary Dashboard                    │
│  2. Creates folder: events/september-2024/                   │
│  3. Uploads photos/videos via drag & drop                    │
│  4. Tags media: "stage", "crowd", "dj", etc.                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDINARY STORAGE                        │
├─────────────────────────────────────────────────────────────┤
│  • Media stored in organized folders                         │
│  • Automatic backups & versioning                           │
│  • CDN distribution worldwide                               │
│  • On-the-fly transformations                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND API                              │
├─────────────────────────────────────────────────────────────┤
│  GET /api/events/{eventId}/gallery                          │
│  • Fetches media from Cloudinary API                        │
│  • Caches results for performance                           │
│  • Returns structured JSON response                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  • Fetches gallery data from backend API                    │
│  • Displays images in existing gallery UI                   │
│  • Lazy loads images as user scrolls                        │
│  • Provides lightbox for full-screen viewing                │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Structure

### Cloudinary Folder Organization

```
beats-on-beltline-gallery/
├── events/
│   ├── 1-september-2024/
│   │   ├── photos/
│   │   │   ├── stage-001.jpg
│   │   │   ├── crowd-002.jpg
│   │   │   └── dj-003.jpg
│   │   └── videos/
│   │       ├── recap-01.mp4
│   │       └── highlight-02.mp4
│   ├── 2-july-2024/
│   │   ├── photos/
│   │   └── videos/
│   └── 3-april-2024/
│       ├── photos/
│       └── videos/
├── hero-images/
│   └── homepage-hero.jpg
└── promotional/
    └── event-flyers/
```

### Database Schema (PostgreSQL)

```sql
-- Events table (already exists, needs gallery fields)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    flyer_url VARCHAR(500),
    cloudinary_folder VARCHAR(255), -- NEW: Cloudinary folder path
    gallery_enabled BOOLEAN DEFAULT false, -- NEW: Show/hide gallery
    photo_count INTEGER DEFAULT 0, -- NEW: Cached count
    video_count INTEGER DEFAULT 0, -- NEW: Cached count
    gallery_updated_at TIMESTAMP, -- NEW: Last fetch time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO events (id, title, date, cloudinary_folder, gallery_enabled) VALUES
(1, 'BOTB - Season 2 Ep. 3', '2024-09-15', 'events/1-september-2024', true),
(2, 'BOTB - Season 2 Ep. 2', '2024-07-20', 'events/2-july-2024', true),
(3, 'BOTB - Season 2 Ep. 1', '2024-04-13', 'events/3-april-2024', true);
```

### API Response Format

```json
// GET /api/events/1/gallery
{
  "eventId": 1,
  "eventTitle": "BOTB - Season 2 Ep. 3",
  "cloudinaryFolder": "events/1-september-2024",
  "photos": [
    {
      "id": "events/1-september-2024/photos/stage-001",
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/1-september-2024/photos/stage-001.jpg",
      "thumbnail": "https://res.cloudinary.com/your-cloud/image/upload/c_fill,w_400,h_400,q_auto/events/1-september-2024/photos/stage-001.jpg",
      "width": 4000,
      "height": 3000,
      "format": "jpg",
      "tags": ["stage", "lighting"],
      "uploadedAt": "2024-09-16T10:30:00Z"
    },
    {
      "id": "events/1-september-2024/photos/crowd-002",
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/events/1-september-2024/photos/crowd-002.jpg",
      "thumbnail": "https://res.cloudinary.com/your-cloud/image/upload/c_fill,w_400,h_400,q_auto/events/1-september-2024/photos/crowd-002.jpg",
      "width": 4000,
      "height": 3000,
      "format": "jpg",
      "tags": ["crowd", "energy"],
      "uploadedAt": "2024-09-16T10:32:00Z"
    }
  ],
  "videos": [
    {
      "id": "events/1-september-2024/videos/recap-01",
      "url": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/events/1-september-2024/videos/recap-01.mp4",
      "thumbnail": "https://res.cloudinary.com/your-cloud/video/upload/so_0/events/1-september-2024/videos/recap-01.jpg",
      "duration": 120,
      "format": "mp4",
      "tags": ["recap"],
      "uploadedAt": "2024-09-16T11:00:00Z"
    }
  ],
  "photoCount": 2,
  "videoCount": 1,
  "lastUpdated": "2024-09-16T11:00:00Z"
}
```

---

## Implementation Plan

### Phase 1: Cloudinary Setup (Week 1)

#### 1.1 Account Configuration
- [ ] Create Cloudinary account (Free tier: 25GB storage, 25GB bandwidth)
- [ ] Set up cloud name: `beats-on-beltline` (or similar)
- [ ] Configure upload presets for photos and videos
- [ ] Set up folder structure in Cloudinary
- [ ] Configure auto-backup settings

#### 1.2 Security & Access
- [ ] Generate API keys (API Key, API Secret)
- [ ] Create upload presets with restrictions
- [ ] Set up user accounts:
  - Admin account (developer)
  - Media Manager account (client)
- [ ] Configure CORS settings for web uploads
- [ ] Set up signed URLs for secure delivery

#### 1.3 Upload Presets
```javascript
// Photo Upload Preset: "event-photos"
{
  "folder": "events/",
  "allowed_formats": ["jpg", "jpeg", "png", "webp"],
  "max_file_size": 10485760, // 10MB
  "quality": "auto:good",
  "fetch_format": "auto"
}

// Video Upload Preset: "event-videos"
{
  "folder": "events/",
  "allowed_formats": ["mp4", "mov", "avi"],
  "max_file_size": 104857600, // 100MB
  "quality": "auto",
  "eager": [
    { "width": 1920, "height": 1080, "crop": "limit" },
    { "width": 1280, "height": 720, "crop": "limit" }
  ]
}
```

---

### Phase 2: Backend API Development (Week 1-2)

#### 2.1 Environment Setup

**File:** `backend/.env`
```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=beats-on-beltline
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_SECURE=true
```

#### 2.2 Dependencies

**File:** `backend/requirements.txt`
```txt
fastapi==0.104.1
uvicorn==0.24.0
python-dotenv==1.0.0
cloudinary==1.36.0  # NEW
psycopg2-binary==2.9.9
python-multipart==0.0.6
redis==5.0.1  # For caching (optional)
```

#### 2.3 Cloudinary Service

**File:** `backend/services/cloudinary_service.py`
```python
import cloudinary
import cloudinary.api
from typing import List, Dict, Optional
from datetime import datetime
import os

class CloudinaryService:
    def __init__(self):
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True
        )
    
    def get_event_gallery(self, folder_path: str) -> Dict:
        """
        Fetch all photos and videos from a Cloudinary folder
        
        Args:
            folder_path: Path to event folder (e.g., "events/1-september-2024")
        
        Returns:
            Dictionary with photos and videos arrays
        """
        try:
            # Fetch photos
            photos_result = cloudinary.api.resources(
                type="upload",
                prefix=f"{folder_path}/photos/",
                max_results=500,
                resource_type="image"
            )
            
            # Fetch videos
            videos_result = cloudinary.api.resources(
                type="upload",
                prefix=f"{folder_path}/videos/",
                max_results=100,
                resource_type="video"
            )
            
            # Transform results
            photos = self._transform_images(photos_result.get('resources', []))
            videos = self._transform_videos(videos_result.get('resources', []))
            
            return {
                "photos": photos,
                "videos": videos,
                "photoCount": len(photos),
                "videoCount": len(videos),
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            print(f"Error fetching gallery: {e}")
            return {
                "photos": [],
                "videos": [],
                "photoCount": 0,
                "videoCount": 0,
                "error": str(e)
            }
    
    def _transform_images(self, resources: List[Dict]) -> List[Dict]:
        """Transform Cloudinary image resources to our format"""
        return [
            {
                "id": resource['public_id'],
                "url": resource['secure_url'],
                "thumbnail": cloudinary.CloudinaryImage(resource['public_id']).build_url(
                    width=400,
                    height=400,
                    crop="fill",
                    quality="auto",
                    fetch_format="auto"
                ),
                "width": resource.get('width'),
                "height": resource.get('height'),
                "format": resource.get('format'),
                "tags": resource.get('tags', []),
                "uploadedAt": resource.get('created_at')
            }
            for resource in resources
        ]
    
    def _transform_videos(self, resources: List[Dict]) -> List[Dict]:
        """Transform Cloudinary video resources to our format"""
        return [
            {
                "id": resource['public_id'],
                "url": resource['secure_url'],
                "thumbnail": cloudinary.CloudinaryVideo(resource['public_id']).build_url(
                    start_offset="0",
                    resource_type="video",
                    format="jpg"
                ),
                "duration": resource.get('duration'),
                "format": resource.get('format'),
                "tags": resource.get('tags', []),
                "uploadedAt": resource.get('created_at')
            }
            for resource in resources
        ]
```

#### 2.4 API Endpoints

**File:** `backend/routes/events.py`
```python
from fastapi import APIRouter, HTTPException
from services.cloudinary_service import CloudinaryService
from database import get_db_connection

router = APIRouter()
cloudinary_service = CloudinaryService()

@router.get("/events/{event_id}/gallery")
async def get_event_gallery(event_id: int):
    """
    Get gallery for a specific event
    
    Args:
        event_id: Event ID
    
    Returns:
        Gallery data with photos and videos
    """
    try:
        # Get event from database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, cloudinary_folder, gallery_enabled
            FROM events
            WHERE id = %s
        """, (event_id,))
        
        event = cursor.fetchone()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        event_id, title, cloudinary_folder, gallery_enabled = event
        
        if not gallery_enabled:
            raise HTTPException(status_code=403, detail="Gallery not enabled for this event")
        
        if not cloudinary_folder:
            raise HTTPException(status_code=404, detail="No Cloudinary folder configured")
        
        # Fetch gallery from Cloudinary
        gallery = cloudinary_service.get_event_gallery(cloudinary_folder)
        
        # Update cache in database
        cursor.execute("""
            UPDATE events
            SET photo_count = %s, video_count = %s, gallery_updated_at = NOW()
            WHERE id = %s
        """, (gallery['photoCount'], gallery['videoCount'], event_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "eventId": event_id,
            "eventTitle": title,
            "cloudinaryFolder": cloudinary_folder,
            **gallery
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events")
async def list_events():
    """
    List all events with gallery info
    
    Returns:
        Array of events with gallery metadata
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, date, location, flyer_url, 
                   gallery_enabled, photo_count, video_count
            FROM events
            ORDER BY date DESC
        """)
        
        events = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return [
            {
                "id": event[0],
                "title": event[1],
                "date": event[2].isoformat() if event[2] else None,
                "location": event[3],
                "flyerUrl": event[4],
                "galleryEnabled": event[5],
                "photoCount": event[6] or 0,
                "videoCount": event[7] or 0
            }
            for event in events
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### 2.5 Database Setup

**File:** `backend/migrations/001_add_gallery_fields.sql`
```sql
-- Add Cloudinary fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS cloudinary_folder VARCHAR(255),
ADD COLUMN IF NOT EXISTS gallery_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gallery_updated_at TIMESTAMP;

-- Update existing events with Cloudinary folders
UPDATE events SET 
    cloudinary_folder = 'events/1-september-2024',
    gallery_enabled = true
WHERE id = 1;

UPDATE events SET 
    cloudinary_folder = 'events/2-july-2024',
    gallery_enabled = true
WHERE id = 2;

UPDATE events SET 
    cloudinary_folder = 'events/3-april-2024',
    gallery_enabled = true
WHERE id = 3;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_gallery_enabled ON events(gallery_enabled);
```

---

### Phase 3: Frontend Integration (Week 2)

#### 3.1 API Client

**File:** `frontend/lib/api.js`
```javascript
// API client for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getEventGallery(eventId) {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/gallery`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch gallery: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getEvents() {
  const response = await fetch(`${API_BASE_URL}/events`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }
  
  return response.json();
}
```

#### 3.2 Update Events Page

**File:** `frontend/pages/events.js` (modifications)
```javascript
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getEventGallery, getEvents } from '../lib/api'
// ... other imports

export default function Events() {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [galleryData, setGalleryData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    
    // Fetch event list from backend
    const [pastEvents, setPastEvents] = useState([])
    
    useEffect(() => {
        // Load events from API on mount
        async function loadEvents() {
            try {
                const events = await getEvents()
                setPastEvents(events.filter(e => e.galleryEnabled))
            } catch (err) {
                console.error('Failed to load events:', err)
            }
        }
        loadEvents()
    }, [])
    
    // Fetch gallery when event is selected
    useEffect(() => {
        if (selectedEvent) {
            loadGallery(selectedEvent)
        } else {
            setGalleryData(null)
        }
    }, [selectedEvent])
    
    async function loadGallery(eventId) {
        setLoading(true)
        setError(null)
        
        try {
            const data = await getEventGallery(eventId)
            setGalleryData(data)
        } catch (err) {
            setError(err.message)
            console.error('Failed to load gallery:', err)
        } finally {
            setLoading(false)
        }
    }
    
    // ... rest of component
    
    // In the gallery section JSX:
    {selectedEvent && galleryData && (
        <section id="event-gallery" className="py-20 bg-white scroll-mt-20">
            <div className="section-container">
                <h2 className="font-festival text-4xl md:text-6xl font-black text-center mb-4 gradient-text uppercase">
                    {galleryData.eventTitle} Gallery
                </h2>
                
                {loading && <p className="text-center">Loading gallery...</p>}
                {error && <p className="text-center text-red-500">Error: {error}</p>}
                
                {/* Photos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {galleryData.photos.map((photo, idx) => (
                        <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer">
                            <Image
                                src={photo.thumbnail}
                                alt={`${galleryData.eventTitle} photo ${idx + 1}`}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                sizes="(max-width: 768px) 50vw, 25vw"
                            />
                        </div>
                    ))}
                </div>
                
                {/* Videos (if any) */}
                {galleryData.videos && galleryData.videos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                        {galleryData.videos.map((video) => (
                            <div key={video.id} className="relative aspect-video rounded-2xl overflow-hidden">
                                <video
                                    src={video.url}
                                    poster={video.thumbnail}
                                    controls
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )}
}
```

#### 3.3 Environment Variables

**File:** `frontend/.env.local`
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production
# NEXT_PUBLIC_API_URL=http://54.210.148.147:8000
```

#### 3.4 Lightbox Component (Optional Enhancement)

**File:** `frontend/components/Lightbox.js`
```javascript
import { useState } from 'react'
import Image from 'next/image'

export default function Lightbox({ images, startIndex = 0, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(startIndex)
    
    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }
    
    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }
    
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowLeft') goToPrevious()
        if (e.key === 'ArrowRight') goToNext()
        if (e.key === 'Escape') onClose()
    }
    
    return (
        <div 
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white text-4xl hover:text-brand-accent"
            >
                ×
            </button>
            
            {/* Previous Button */}
            <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute left-4 text-white text-4xl hover:text-brand-accent"
            >
                ‹
            </button>
            
            {/* Image */}
            <div 
                className="relative max-w-7xl max-h-[90vh] w-full h-full"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={images[currentIndex].url}
                    alt={`Photo ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="90vw"
                    priority
                />
            </div>
            
            {/* Next Button */}
            <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 text-white text-4xl hover:text-brand-accent"
            >
                ›
            </button>
            
            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    )
}
```

---

### Phase 4: Client Training & Documentation (Week 3)

#### 4.1 Client User Guide

**File:** `docs/CLIENT_GUIDE_Cloudinary.md`
```markdown
# Cloudinary Media Management Guide

## Getting Started

### Login
1. Go to: https://cloudinary.com/console
2. Email: [client email]
3. Password: [provided separately]

### Dashboard Overview
- **Media Library:** Browse all your photos/videos
- **Upload:** Add new media
- **Analytics:** View usage stats
- **Settings:** Manage account

## Uploading Event Photos

### Step 1: Navigate to Events Folder
1. Click "Media Library" in sidebar
2. Navigate to `events/` folder
3. Find or create event folder (e.g., `1-september-2024`)

### Step 2: Upload Photos
1. Click "Upload" button (top right)
2. Drag & drop photos or click to browse
3. Wait for upload to complete (green checkmarks)
4. Photos appear immediately in gallery

### Best Practices
- **File Names:** Use descriptive names (stage-dj-01.jpg, crowd-dancing-02.jpg)
- **File Size:** Under 10MB per photo (Cloudinary auto-compresses)
- **Format:** JPG or PNG preferred
- **Quantity:** No limit! Upload as many as needed

### Step 3: Organize with Tags
1. Select uploaded photo
2. Click "Details" panel (right side)
3. Add tags: `stage`, `crowd`, `dj`, `food`, `vendors`
4. Tags help with future organization

## Uploading Videos

### Step 1: Navigate to Videos Folder
1. Go to `events/[event-name]/videos/` folder
2. Click "Upload"

### Step 2: Upload Video
1. Select video file (MP4, MOV, or AVI)
2. Under 100MB recommended
3. Cloudinary automatically transcodes for web

### Video Tips
- **Format:** MP4 preferred (universal compatibility)
- **Length:** Keep under 2 minutes for best performance
- **Quality:** 1080p or 720p (auto-optimized)

## Managing Events

### Creating a New Event
1. Create folder: `events/[id]-[month]-[year]`
   - Example: `events/4-october-2025`
2. Inside, create subfolders:
   - `photos/`
   - `videos/`
3. Notify developer to enable gallery in database

### Editing Photos
1. Click photo in Media Library
2. Click "Edit" button
3. Crop, rotate, add filters
4. Click "Apply" to save

### Deleting Media
1. Select photo/video
2. Click trash icon
3. Confirm deletion
4. Changes reflect immediately on website

## Troubleshooting

### Upload Stuck?
- Check internet connection
- File might be too large (over 100MB for videos)
- Try smaller batch (10 photos at a time)

### Photo Not Appearing on Website?
- Wait 1 minute (cache refresh)
- Check correct folder: `events/[event-id]/photos/`
- Verify file uploaded successfully (green checkmark)

### Video Won't Play?
- Ensure format is MP4, MOV, or AVI
- Check file size (under 100MB)
- Transcoding takes 1-2 minutes

## Support
For technical issues:
- Email: [developer email]
- Phone: [phone number]
- Response time: 24 hours
```

#### 4.2 Developer Handoff Checklist

```markdown
# Cloudinary Integration Handoff

## Pre-Launch Checklist

### Cloudinary Account
- [ ] Account created and verified
- [ ] Upload presets configured
- [ ] Folder structure created
- [ ] Client user account created with appropriate permissions
- [ ] API keys stored in backend .env file
- [ ] Billing set up (credit card on file)

### Backend
- [ ] Cloudinary Python SDK installed
- [ ] CloudinaryService implemented and tested
- [ ] API endpoints created (/events, /events/{id}/gallery)
- [ ] Database migration run (gallery fields added)
- [ ] Existing events configured with Cloudinary folders
- [ ] Error handling implemented
- [ ] API documented (Swagger/OpenAPI)

### Frontend
- [ ] API client functions created
- [ ] Events page updated to fetch from API
- [ ] Gallery displays Cloudinary images
- [ ] Lightbox component added (optional)
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Environment variables set (NEXT_PUBLIC_API_URL)

### Testing
- [ ] Upload test photos to Cloudinary
- [ ] Verify API returns correct data
- [ ] Test gallery display on frontend
- [ ] Test on mobile devices
- [ ] Test with 100+ photos (performance)
- [ ] Test video playback
- [ ] Test error scenarios (network failure, invalid event)

### Documentation
- [ ] Client user guide created
- [ ] Developer documentation updated
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Deployment notes updated

### Training
- [ ] Client walkthrough scheduled
- [ ] Recorded demo video created
- [ ] Support contact info provided
- [ ] Emergency rollback plan documented
```

---

## Security Considerations

### API Key Protection
- ✅ Store API keys in environment variables (never in code)
- ✅ Use `.env` file locally, environment variables in production
- ✅ Add `.env` to `.gitignore`
- ✅ Use signed URLs for sensitive content
- ✅ Restrict API keys to specific domains (CORS)

### Access Control
- ✅ Client user has "Media Library User" role (upload/organize only)
- ✅ Admin user has full access (settings, billing)
- ✅ Upload presets restrict file types and sizes
- ✅ Backend API validates event IDs before fetching

### Rate Limiting
- ✅ Implement rate limiting on backend API (100 requests/minute)
- ✅ Cache gallery responses (5 minutes TTL)
- ✅ Use Redis for distributed caching (optional)

### Content Validation
- ✅ Validate file types on upload
- ✅ Scan for malware (Cloudinary's built-in)
- ✅ Restrict max file sizes
- ✅ Moderate uploaded content (manual review)

---

## Performance Optimization

### Image Optimization
```javascript
// Cloudinary automatic optimizations
{
  quality: "auto:good",      // Smart quality reduction
  fetch_format: "auto",      // WebP for supported browsers
  dpr: "auto",              // Retina display support
  responsive: true          // Responsive breakpoints
}
```

### Lazy Loading
```javascript
// Load images as user scrolls
<Image
  src={photo.thumbnail}
  loading="lazy"
  sizes="(max-width: 768px) 50vw, 25vw"
/>
```

### Caching Strategy
1. **Browser Cache:** 1 year for media URLs
2. **API Cache:** 5 minutes for gallery data
3. **CDN Cache:** Global edge caching via Cloudinary CDN

### Performance Targets
- **Gallery Load Time:** < 2 seconds (50 photos)
- **Image Load Time:** < 500ms per thumbnail
- **Lighthouse Score:** 90+ (Performance)

---

## Cost Analysis

### Cloudinary Pricing (Nov 2025)

| Tier | Storage | Bandwidth | Cost/Month | Use Case |
|------|---------|-----------|-----------|----------|
| **Free** | 25GB | 25GB | $0 | Testing, < 5 events |
| **Plus** | 75GB | 150GB | $89 | 10-15 events, ~1000 photos |
| **Advanced** | 150GB | 300GB | $224 | 20-30 events, ~2000 photos |
| **Custom** | Unlimited | Unlimited | Custom | Enterprise scale |

### Estimated Usage

**Per Event:**
- Photos: 200 photos × 3MB avg = 600MB
- Videos: 5 videos × 50MB avg = 250MB
- **Total:** ~850MB per event

**Annual (12 events):**
- Storage: 12 × 850MB = 10.2GB
- Bandwidth (50K views): ~51GB
- **Cost:** Free tier sufficient for Year 1

**Growth (3 years, 36 events):**
- Storage: 36 × 850MB = 30.6GB
- Bandwidth (150K views): ~153GB
- **Cost:** ~$89/month (Plus tier)

### ROI Comparison

| Approach | Setup Cost | Monthly Cost | Annual Cost | Dev Time |
|----------|----------|-------------|-------------|----------|
| **Static Files** | $0 | $0 | $0 | High (ongoing) |
| **S3 + CloudFront** | $200 | $15 | $380 | 40 hours |
| **Cloudinary Free** | $0 | $0 | $0 | 16 hours |
| **Cloudinary Plus** | $0 | $89 | $1,068 | 16 hours |

**Break-even Analysis:**
- Cloudinary Plus vs S3: $89/mo vs $15/mo = $74/mo difference
- Dev time saved: 24 hours × $100/hr = $2,400
- Cloudinary breaks even after: $2,400 ÷ $74 = 32 months
- **Recommendation:** Start with Cloudinary Free, upgrade as needed

---

## Testing Plan

### Unit Tests

```python
# backend/tests/test_cloudinary_service.py
import pytest
from services.cloudinary_service import CloudinaryService

def test_get_event_gallery():
    service = CloudinaryService()
    gallery = service.get_event_gallery("events/1-september-2024")
    
    assert gallery is not None
    assert "photos" in gallery
    assert "videos" in gallery
    assert isinstance(gallery["photos"], list)
    assert gallery["photoCount"] >= 0

def test_transform_images():
    service = CloudinaryService()
    resources = [
        {
            "public_id": "events/test/photo1",
            "secure_url": "https://cloudinary.com/...",
            "width": 4000,
            "height": 3000,
            "format": "jpg",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
    
    transformed = service._transform_images(resources)
    
    assert len(transformed) == 1
    assert "thumbnail" in transformed[0]
    assert transformed[0]["width"] == 4000
```

### Integration Tests

```javascript
// frontend/tests/api.test.js
import { getEventGallery, getEvents } from '../lib/api'

describe('API Integration', () => {
  test('fetches event gallery', async () => {
    const gallery = await getEventGallery(1)
    
    expect(gallery).toHaveProperty('eventId')
    expect(gallery).toHaveProperty('photos')
    expect(gallery).toHaveProperty('videos')
    expect(gallery.photos).toBeInstanceOf(Array)
  })
  
  test('fetches events list', async () => {
    const events = await getEvents()
    
    expect(events).toBeInstanceOf(Array)
    expect(events.length).toBeGreaterThan(0)
    expect(events[0]).toHaveProperty('id')
    expect(events[0]).toHaveProperty('title')
  })
})
```

### Manual Testing Checklist

#### Gallery Display
- [ ] Gallery loads for all past events
- [ ] Photos display in grid layout
- [ ] Thumbnails are sharp and properly sized
- [ ] Clicking photo opens lightbox (if implemented)
- [ ] Videos play with controls
- [ ] Loading spinner shows during fetch
- [ ] Error message displays on failure

#### Performance
- [ ] Gallery loads in < 2 seconds
- [ ] Lazy loading works (images load as scrolled)
- [ ] No layout shift during image load
- [ ] Mobile performance is smooth

#### Client Workflow
- [ ] Client can log into Cloudinary
- [ ] Client can upload photos to correct folder
- [ ] Photos appear on website within 1 minute
- [ ] Client can delete photos
- [ ] Changes reflect on website immediately

#### Edge Cases
- [ ] Empty gallery displays appropriate message
- [ ] Gallery with 200+ photos loads properly
- [ ] Video without thumbnail displays default
- [ ] Network failure shows error message
- [ ] Invalid event ID returns 404

---

## Rollout Plan

### Week 1: Setup & Development
- **Days 1-2:** Cloudinary account setup, folder structure
- **Days 3-5:** Backend API development
- **Days 6-7:** Database migration, testing

### Week 2: Frontend & Testing
- **Days 8-10:** Frontend integration
- **Days 11-12:** Lightbox implementation (optional)
- **Days 13-14:** Integration testing, bug fixes

### Week 3: Launch & Training
- **Days 15-16:** Staging deployment, final testing
- **Day 17:** Client training session
- **Day 18:** Production deployment
- **Days 19-21:** Monitoring, support, iterations

### Go-Live Checklist
- [ ] All tests passing
- [ ] Cloudinary account verified and funded
- [ ] Client trained and confident
- [ ] Support plan in place
- [ ] Monitoring dashboard set up
- [ ] Rollback plan documented
- [ ] Stakeholder approval received

---

## Success Metrics

### Technical KPIs
- **API Response Time:** < 500ms (p95)
- **Gallery Load Time:** < 2s for 50 photos
- **Uptime:** 99.9%
- **Error Rate:** < 0.1%

### Business KPIs
- **Client Satisfaction:** Can upload media independently
- **Update Frequency:** Gallery updated within 24h of event
- **Photo Volume:** 200+ photos per event
- **Engagement:** Gallery views increase by 30%

### User Experience KPIs
- **Page Load Score:** Lighthouse 90+
- **Mobile Experience:** Same performance as desktop
- **Bounce Rate:** < 40% on gallery pages
- **Time on Page:** > 2 minutes (gallery pages)

---

## Risks & Mitigation

### Risk 1: Client Adoption
**Risk:** Client doesn't adopt Cloudinary, continues emailing photos to developer  
**Impact:** High - defeats purpose of self-service  
**Probability:** Medium  
**Mitigation:**
- Comprehensive training session
- Record demo video for reference
- Make process simpler than email
- Provide dedicated support for first month

### Risk 2: Cost Overrun
**Risk:** Storage/bandwidth exceeds free tier faster than expected  
**Impact:** Medium - unexpected costs  
**Probability:** Low  
**Mitigation:**
- Set up billing alerts at 80% usage
- Monitor usage monthly
- Implement caching to reduce bandwidth
- Have budget approval for Plus tier ($89/mo)

### Risk 3: Performance Issues
**Risk:** Gallery loads slowly with hundreds of photos  
**Impact:** High - poor user experience  
**Probability:** Medium  
**Mitigation:**
- Implement pagination (50 photos per page)
- Use lazy loading
- Cache API responses
- Monitor Core Web Vitals

### Risk 4: Cloudinary Outage
**Risk:** Cloudinary service is down, galleries don't load  
**Impact:** Medium - galleries unavailable  
**Probability:** Low (99.99% uptime SLA)  
**Mitigation:**
- Display graceful error message
- Cache recently fetched galleries
- Have fallback to static placeholder images
- Monitor status page: status.cloudinary.com

---

## Future Enhancements

### Phase 2 (Q1 2026)
- [ ] **Advanced Filtering:** Filter gallery by tags (stage, crowd, dj)
- [ ] **Social Sharing:** Share individual photos to social media
- [ ] **Download Gallery:** Bulk download all event photos (ZIP)
- [ ] **Photo Credits:** Attribute photos to photographers

### Phase 3 (Q2 2026)
- [ ] **AI Tagging:** Automatic tagging using Cloudinary AI
- [ ] **Face Detection:** Blur faces for privacy (GDPR)
- [ ] **Video Clips:** Auto-generate short clips for social media
- [ ] **Live Upload:** Real-time photo uploads during event

### Phase 4 (Q3 2026)
- [ ] **User Submissions:** Allow attendees to upload their photos
- [ ] **Moderation Queue:** Review user-submitted photos before publishing
- [ ] **Photo Contests:** Vote for best photo of the event
- [ ] **NFT Gallery:** Mint select photos as NFTs

---

## Appendix

### A. Cloudinary API Reference

**List Resources in Folder:**
```python
cloudinary.api.resources(
    type="upload",
    prefix="events/1-september-2024/photos/",
    max_results=500,
    resource_type="image"
)
```

**Search by Tags:**
```python
cloudinary.Search()
    .expression("tags:stage AND folder:events/1-*")
    .sort_by("created_at", "desc")
    .max_results(100)
    .execute()
```

**Generate Thumbnail:**
```python
cloudinary.CloudinaryImage("photo_id").build_url(
    width=400,
    height=400,
    crop="fill",
    quality="auto",
    fetch_format="auto"
)
```

### B. Database Schema Reference

```sql
-- Full events table schema
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    description TEXT,
    flyer_url VARCHAR(500),
    attendees VARCHAR(50),
    artists VARCHAR(50),
    
    -- Cloudinary integration
    cloudinary_folder VARCHAR(255),
    gallery_enabled BOOLEAN DEFAULT false,
    photo_count INTEGER DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    gallery_updated_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    -- Indexes
    CONSTRAINT unique_cloudinary_folder UNIQUE(cloudinary_folder)
);
```

### C. Environment Variables Reference

**Backend (.env):**
```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=beats-on-beltline
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_SECURE=true

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# API
API_HOST=0.0.0.0
API_PORT=8000
```

**Frontend (.env.local):**
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Cloudinary (for client-side uploads - optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=beats-on-beltline
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=event-photos
```

---

## Approval & Sign-Off

### Stakeholders

| Role | Name | Approval | Date |
|------|------|----------|------|
| **Product Owner** | [Name] | ☐ Approved ☐ Rejected | __/__/__ |
| **Technical Lead** | [Name] | ☐ Approved ☐ Rejected | __/__/__ |
| **Client** | [Name] | ☐ Approved ☐ Rejected | __/__/__ |

### Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-11 | AI Assistant | Initial PRD creation |
| | | | |

---

## Contact & Support

**Project Lead:** [Name]  
**Email:** [email]  
**Phone:** [phone]  

**Cloudinary Support:**  
**Email:** support@cloudinary.com  
**Docs:** https://cloudinary.com/documentation  
**Status:** https://status.cloudinary.com  

---

*End of PRD*



