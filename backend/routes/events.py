"""
API routes for event management and galleries
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from datetime import datetime
from services.cloudinary_service import CloudinaryService
from database import get_db_cursor, execute_query

router = APIRouter(prefix="/api/events", tags=["events"])
cloudinary_service = CloudinaryService()


@router.get("")
async def list_events():
    """
    Get list of all events with gallery metadata.
    
    Returns:
        Array of events sorted by date (newest first)
    """
    try:
        query = """
            SELECT 
                id, title, date, location, flyer_url,
                attendees, artists, description,
                gallery_enabled, photo_count, video_count,
                cloudinary_folder, gallery_updated_at
            FROM events
            ORDER BY date DESC
        """
        
        events = execute_query(query, fetch="all")
        
        # Transform to JSON-serializable format
        result = []
        for event in events:
            result.append({
                "id": event['id'],
                "title": event['title'],
                "date": event['date'].isoformat() if event['date'] else None,
                "location": event['location'],
                "flyerUrl": event['flyer_url'],
                "attendees": event['attendees'],
                "artists": event['artists'],
                "description": event['description'],
                "galleryEnabled": event['gallery_enabled'],
                "photoCount": event['photo_count'] or 0,
                "videoCount": event['video_count'] or 0,
                "cloudinaryFolder": event['cloudinary_folder'],
                "galleryUpdatedAt": event['gallery_updated_at'].isoformat() if event['gallery_updated_at'] else None
            })
        
        return result
    
    except Exception as e:
        print(f"❌ Error fetching events: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")


@router.get("/{event_id}")
async def get_event(event_id: int):
    """
    Get details for a specific event.
    
    Args:
        event_id: Event ID
    
    Returns:
        Event details
    """
    try:
        query = """
            SELECT 
                id, title, date, location, flyer_url,
                attendees, artists, description,
                gallery_enabled, photo_count, video_count,
                cloudinary_folder, gallery_updated_at
            FROM events
            WHERE id = %s
        """
        
        event = execute_query(query, params=(event_id,), fetch="one")
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return {
            "id": event['id'],
            "title": event['title'],
            "date": event['date'].isoformat() if event['date'] else None,
            "location": event['location'],
            "flyerUrl": event['flyer_url'],
            "attendees": event['attendees'],
            "artists": event['artists'],
            "description": event['description'],
            "galleryEnabled": event['gallery_enabled'],
            "photoCount": event['photo_count'] or 0,
            "videoCount": event['video_count'] or 0,
            "cloudinaryFolder": event['cloudinary_folder'],
            "galleryUpdatedAt": event['gallery_updated_at'].isoformat() if event['gallery_updated_at'] else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch event: {str(e)}")


@router.get("/{event_id}/gallery")
async def get_event_gallery(event_id: int):
    """
    Get gallery (photos and videos) for a specific event.
    Fetches media from Cloudinary and caches counts in database.
    
    Args:
        event_id: Event ID
    
    Returns:
        Gallery data with photos and videos
    """
    try:
        # Get event from database
        query = """
            SELECT id, title, cloudinary_folder, gallery_enabled
            FROM events
            WHERE id = %s
        """
        
        event = execute_query(query, params=(event_id,), fetch="one")
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        if not event['gallery_enabled']:
            raise HTTPException(
                status_code=403, 
                detail="Gallery not enabled for this event"
            )
        
        if not event['cloudinary_folder']:
            raise HTTPException(
                status_code=404, 
                detail="No Cloudinary folder configured for this event"
            )
        
        # Fetch gallery from Cloudinary
        gallery = cloudinary_service.get_event_gallery(event['cloudinary_folder'])
        
        # Update cache in database
        update_query = """
            UPDATE events
            SET photo_count = %s, 
                video_count = %s, 
                gallery_updated_at = NOW()
            WHERE id = %s
        """
        
        execute_query(
            update_query, 
            params=(gallery['photoCount'], gallery['videoCount'], event_id),
            fetch="none"
        )
        
        return {
            "eventId": event['id'],
            "eventTitle": event['title'],
            "cloudinaryFolder": event['cloudinary_folder'],
            "photos": gallery['photos'],
            "videos": gallery['videos'],
            "photoCount": gallery['photoCount'],
            "videoCount": gallery['videoCount'],
            "lastUpdated": gallery['lastUpdated']
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching gallery for event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch gallery: {str(e)}")


@router.get("/test/cloudinary")
async def test_cloudinary_connection():
    """
    Test Cloudinary API connection.
    
    Returns:
        Connection status
    """
    try:
        is_connected = cloudinary_service.test_connection()
        
        return {
            "status": "success" if is_connected else "failed",
            "message": "Cloudinary API connection successful" if is_connected else "Cloudinary API connection failed",
            "cloudName": cloudinary_service.cloud_name
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error testing Cloudinary connection: {str(e)}"
        }


# Gallery route (outside of /api/events prefix)
from fastapi import APIRouter as BaseRouter
gallery_router = BaseRouter(prefix="/api", tags=["gallery"])

@gallery_router.get("/gallery")
async def get_gallery():
    """
    Get all gallery photos and videos from main events/photos folder.
    
    Returns:
        Gallery data with all photos and videos
    """
    try:
        # Fetch all media directly from events/photos folder (without subfolder)
        import cloudinary.api
        
        # Fetch all images from events/photos
        photos_result = cloudinary.api.resources(
            type="upload",
            prefix="events/photos/",
            max_results=500,
            resource_type="image"
        )
        
        # Fetch all videos from events/photos
        videos_result = cloudinary.api.resources(
            type="upload",
            prefix="events/photos/",
            max_results=100,
            resource_type="video"
        )
        
        # Transform results
        from datetime import datetime
        photos = cloudinary_service._transform_images(photos_result.get('resources', []))
        videos = cloudinary_service._transform_videos(videos_result.get('resources', []))
        
        return {
            "photos": photos,
            "videos": videos,
            "photoCount": len(photos),
            "videoCount": len(videos),
            "lastUpdated": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        print(f"❌ Error fetching main gallery: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch gallery: {str(e)}")

