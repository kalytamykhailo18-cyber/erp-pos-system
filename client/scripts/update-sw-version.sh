#!/bin/bash
# Updates Service Worker version with current timestamp

SW_FILE="./public/sw.js"
TIMESTAMP=$(date +%s%3N)

echo "Updating Service Worker version..."
echo "Timestamp: $TIMESTAMP"

# Replace placeholder with actual timestamp
sed -i "s/{{BUILD_TIMESTAMP}}/$TIMESTAMP/g" "$SW_FILE"

echo "✅ Service Worker version updated: v2-$TIMESTAMP"
