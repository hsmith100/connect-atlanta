#!/bin/bash

# Upload event flyers to unified gallery folder
# Folder: events/photos

CLOUD_NAME="beats-on-beltline"
API_KEY="132531398566916"
API_SECRET="7NLfDFSPbupwHOcoviFHMM5FOZM"

echo "🚀 Uploading event flyers to Cloudinary events/photos folder..."
echo ""

# Array of event flyers
flyers=(
    "april-2025.png|April 2025 Event"
    "may-2025.png|May 2025 Event"
    "july-2025.png|July 2025 Event"
    "september-2025.png|September 2025 Event"
)

for flyer in "${flyers[@]}"; do
    IFS='|' read -r filename display <<< "$flyer"
    
    echo "📸 Uploading $filename ($display)..."
    
    npx cloudinary upload "frontend/public/images/events/$filename" \
        --cloud_name "$CLOUD_NAME" \
        --api_key "$API_KEY" \
        --api_secret "$API_SECRET" \
        --folder "events/photos" \
        --overwrite true \
        --resource-type image
    
    if [ $? -eq 0 ]; then
        echo "   ✅ $filename uploaded successfully"
    else
        echo "   ❌ Failed to upload $filename"
    fi
    echo ""
done

echo "🎉 Upload complete!"
echo ""
echo "🌐 View gallery at: http://98.81.74.242:3000/gallery"



