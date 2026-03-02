#!/bin/bash

# Upload event flyers to Cloudinary
# Using the npx cloudinary CLI

CLOUD_NAME="beats-on-beltline"
API_KEY="132531398566916"
API_SECRET="7NLfDFSPbupwHOcoviFHMM5FOZM"
SOURCE_DIR="frontend/public/images/events"

echo "📸 Uploading Event Flyers to Cloudinary"
echo "========================================"
echo ""

# Define events array: "folder|flyer-filename|display-name"
events=(
    "events/1-april-2025/photos|april-2025.png|April 2025"
    "events/2-may-2025/photos|may-2025.png|May 2025"
    "events/3-july-2025/photos|july-2025.png|July 2025"
    "events/4-september-2025/photos|september-2025.png|September 2025"
)

# Upload each flyer
for event in "${events[@]}"; do
    IFS='|' read -r folder flyer display <<< "$event"
    
    echo "📂 Uploading $display to $folder"
    npx cloudinary upload "$SOURCE_DIR/$flyer" \
        --cloud_name "$CLOUD_NAME" \
        --api_key "$API_KEY" \
        --api_secret "$API_SECRET" \
        --folder "$folder" \
        --public_id "${flyer%.png}" \
        --unique_filename false \
        --overwrite true
    
    if [ $? -eq 0 ]; then
        echo "  ✅ $flyer uploaded successfully"
    else
        echo "  ❌ Failed to upload $flyer"
    fi
    echo ""
done

echo "✅ All flyers uploaded!"
echo ""
echo "To verify, run:"
echo "  docker-compose exec -T backend python /app/manage_cloudinary.py list"

