"""
Cloudinary service for managing event gallery media
"""
import os
import cloudinary
import cloudinary.api
from typing import List, Dict, Optional
from datetime import datetime


class CloudinaryService:
    """
    Service for interacting with Cloudinary API to fetch event galleries.
    """
    
    def __init__(self):
        """Initialize Cloudinary configuration from environment variables"""
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=os.getenv("CLOUDINARY_SECURE", "true").lower() == "true"
        )
        self.cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    
    def get_event_gallery(self, folder_path: str) -> Dict:
        """
        Fetch all photos and videos from a Cloudinary folder.
        
        Args:
            folder_path: Path to event folder (e.g., "events/1-september-2024")
        
        Returns:
            Dictionary with photos and videos arrays
        """
        try:
            # Fetch photos from photos subfolder
            photos_result = cloudinary.api.resources(
                type="upload",
                prefix=f"{folder_path}/photos/",
                max_results=500,
                resource_type="image"
            )
            
            # Fetch videos from videos subfolder
            videos_result = cloudinary.api.resources(
                type="upload",
                prefix=f"{folder_path}/videos/",
                max_results=100,
                resource_type="video"
            )
            
            # Transform results to our format
            photos = self._transform_images(photos_result.get('resources', []))
            videos = self._transform_videos(videos_result.get('resources', []))
            
            return {
                "photos": photos,
                "videos": videos,
                "photoCount": len(photos),
                "videoCount": len(videos),
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        except cloudinary.api.NotFound:
            # Folder doesn't exist or is empty
            return {
                "photos": [],
                "videos": [],
                "photoCount": 0,
                "videoCount": 0,
                "error": f"Folder '{folder_path}' not found"
            }
        
        except Exception as e:
            print(f"❌ Error fetching gallery from Cloudinary: {e}")
            return {
                "photos": [],
                "videos": [],
                "photoCount": 0,
                "videoCount": 0,
                "error": str(e)
            }
    
    def _transform_images(self, resources: List[Dict]) -> List[Dict]:
        """
        Transform Cloudinary image resources to our standardized format.
        
        Args:
            resources: List of Cloudinary image resource objects
        
        Returns:
            List of transformed image dictionaries
        """
        transformed = []
        
        for resource in resources:
            try:
                public_id = resource['public_id']
                
                # Build optimized URLs using Cloudinary transformations
                transformed.append({
                    "id": public_id,
                    "url": resource['secure_url'],
                    "thumbnail": self._build_thumbnail_url(public_id, "image"),
                    "width": resource.get('width'),
                    "height": resource.get('height'),
                    "format": resource.get('format'),
                    "tags": resource.get('tags', []),
                    "uploadedAt": resource.get('created_at')
                })
            except Exception as e:
                print(f"⚠️ Error transforming image resource: {e}")
                continue
        
        return transformed
    
    def _transform_videos(self, resources: List[Dict]) -> List[Dict]:
        """
        Transform Cloudinary video resources to our standardized format.
        
        Args:
            resources: List of Cloudinary video resource objects
        
        Returns:
            List of transformed video dictionaries
        """
        transformed = []
        
        for resource in resources:
            try:
                public_id = resource['public_id']
                
                transformed.append({
                    "id": public_id,
                    "url": resource['secure_url'],
                    "thumbnail": self._build_thumbnail_url(public_id, "video"),
                    "duration": resource.get('duration'),
                    "format": resource.get('format'),
                    "tags": resource.get('tags', []),
                    "uploadedAt": resource.get('created_at')
                })
            except Exception as e:
                print(f"⚠️ Error transforming video resource: {e}")
                continue
        
        return transformed
    
    def _build_thumbnail_url(self, public_id: str, resource_type: str) -> str:
        """
        Build an optimized thumbnail URL for an image or video.
        
        Args:
            public_id: Cloudinary public ID
            resource_type: "image" or "video"
        
        Returns:
            Thumbnail URL with transformations applied
        """
        if resource_type == "image":
            # Generate thumbnail: 400x400, fill, auto quality, auto format
            return f"https://res.cloudinary.com/{self.cloud_name}/image/upload/c_fill,w_400,h_400,q_auto,f_auto/{public_id}"
        else:
            # Generate video thumbnail from first frame
            return f"https://res.cloudinary.com/{self.cloud_name}/video/upload/so_0,w_400,h_400,c_fill/{public_id}.jpg"
    
    def test_connection(self) -> bool:
        """
        Test Cloudinary API connection.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Try to fetch account usage info
            cloudinary.api.usage()
            return True
        except Exception as e:
            print(f"❌ Cloudinary connection test failed: {e}")
            return False

