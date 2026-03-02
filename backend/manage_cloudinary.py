#!/usr/bin/env python3
"""
Cloudinary management script for folder structure and uploads
"""
import os
import sys
import cloudinary
import cloudinary.api
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def list_folders(prefix=""):
    """List all folders in Cloudinary"""
    try:
        print(f"\n📁 Folders in Cloudinary (prefix: '{prefix or 'root'}')")
        print("=" * 60)
        
        result = cloudinary.api.root_folders()
        folders = result.get('folders', [])
        
        if not folders:
            print("  (no folders found)")
            return
        
        for folder in folders:
            print(f"  📁 {folder['name']}")
            
            # Try to list subfolders
            try:
                subresult = cloudinary.api.subfolders(folder['name'])
                subfolders = subresult.get('folders', [])
                for subfolder in subfolders:
                    print(f"    📁 {folder['name']}/{subfolder['name']}")
                    
                    # Try to list sub-subfolders
                    try:
                        subsubresult = cloudinary.api.subfolders(f"{folder['name']}/{subfolder['name']}")
                        subsubfolders = subsubresult.get('folders', [])
                        for subsubfolder in subsubfolders:
                            print(f"      📁 {folder['name']}/{subfolder['name']}/{subsubfolder['name']}")
                    except:
                        pass
            except:
                pass
        
        print()
        
    except Exception as e:
        print(f"❌ Error listing folders: {e}")
        return

def list_resources_in_folder(folder_path):
    """List all resources (images/videos) in a specific folder"""
    try:
        print(f"\n🖼️  Resources in '{folder_path}'")
        print("=" * 60)
        
        # List images
        try:
            result = cloudinary.api.resources(
                type="upload",
                prefix=folder_path,
                max_results=100,
                resource_type="image"
            )
            resources = result.get('resources', [])
            
            if resources:
                print(f"\n  Images: ({len(resources)})")
                for resource in resources:
                    print(f"    🖼️  {resource['public_id']}")
            else:
                print(f"  No images found in {folder_path}")
        except:
            print(f"  No images found in {folder_path}")
        
        # List videos
        try:
            result = cloudinary.api.resources(
                type="upload",
                prefix=folder_path,
                max_results=100,
                resource_type="video"
            )
            resources = result.get('resources', [])
            
            if resources:
                print(f"\n  Videos: ({len(resources)})")
                for resource in resources:
                    print(f"    🎥 {resource['public_id']}")
        except:
            pass
        
        print()
        
    except Exception as e:
        print(f"❌ Error listing resources: {e}")

def create_folder_structure():
    """
    Create the expected folder structure for events.
    Note: Cloudinary creates folders implicitly when you upload to them,
    so we'll create a placeholder file in each folder.
    """
    folders = [
        "events/1-april-2024/photos",
        "events/2-may-2024/photos",
        "events/3-july-2024/photos",
        "events/4-september-2024/photos",
    ]
    
    print("\n📂 Creating folder structure...")
    print("=" * 60)
    print("Note: Folders are created implicitly in Cloudinary when you upload files.")
    print("The structure will be created when you upload photos.\n")
    
    for folder in folders:
        print(f"  ✓ {folder}/ (ready for uploads)")
    
    print("\n✅ Folder structure defined!")
    print("Upload images to these paths to create the folders.\n")

def test_connection():
    """Test Cloudinary connection"""
    try:
        result = cloudinary.api.usage()
        print("\n✅ Cloudinary Connection Successful!")
        print("=" * 60)
        print(f"  Cloud Name: {os.getenv('CLOUDINARY_CLOUD_NAME')}")
        print(f"  Plan: {result.get('plan', 'N/A')}")
        print(f"  Credits Used: {result.get('credits', {}).get('usage', 0)} / {result.get('credits', {}).get('limit', 0)}")
        print(f"  Storage Used: {result.get('storage', {}).get('usage', 0) / 1024 / 1024:.2f} MB")
        print()
        return True
    except Exception as e:
        print(f"\n❌ Cloudinary Connection Failed: {e}\n")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\n🎨 Cloudinary Management Tool")
        print("=" * 60)
        print("\nUsage:")
        print("  python manage_cloudinary.py test              - Test connection")
        print("  python manage_cloudinary.py list              - List all folders")
        print("  python manage_cloudinary.py show <folder>     - List resources in folder")
        print("  python manage_cloudinary.py create            - Show folder structure to create")
        print("\nExamples:")
        print("  python manage_cloudinary.py test")
        print("  python manage_cloudinary.py list")
        print("  python manage_cloudinary.py show events/4-september-2024/photos")
        print()
        sys.exit(0)
    
    command = sys.argv[1].lower()
    
    if command == "test":
        test_connection()
    elif command == "list":
        if test_connection():
            list_folders()
    elif command == "show":
        if len(sys.argv) < 3:
            print("❌ Please provide a folder path")
            print("Example: python manage_cloudinary.py show events/4-september-2024/photos")
            sys.exit(1)
        folder_path = sys.argv[2]
        if test_connection():
            list_resources_in_folder(folder_path)
    elif command == "create":
        create_folder_structure()
    else:
        print(f"❌ Unknown command: {command}")
        print("Run without arguments to see usage.")

