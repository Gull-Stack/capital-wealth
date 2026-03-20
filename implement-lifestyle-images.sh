#!/bin/bash

# Capital Wealth Lifestyle Images Implementation Script
# This script helps integrate downloaded lifestyle images into the brand page

echo "🏔️ Capital Wealth Lifestyle Images Implementation"
echo "=================================================="

# Check if lifestyle directory exists
LIFESTYLE_DIR="assets/images/lifestyle"
if [ ! -d "$LIFESTYLE_DIR" ]; then
    echo "❌ Lifestyle directory not found: $LIFESTYLE_DIR"
    echo "Creating directory..."
    mkdir -p "$LIFESTYLE_DIR"
    echo "✅ Created: $LIFESTYLE_DIR"
fi

# Expected image files
declare -a EXPECTED_IMAGES=(
    "active-woman-jogging-mountain-lake-healthy-retirement.jpg"
    "couple-hiking-alpine-hillside-active-retirement.jpg"
    "couple-hiking-mountain-trail-sunset-retirement-journey.jpg"
    "couple-holding-hands-lake-dock-retirement-together.jpg"
    "couple-mountain-summit-overlooking-valley-retirement-goals.jpg"
    "couple-walking-waterfront-sunset-retirement-lifestyle.jpg"
    "golden-sunset-mountain-meadow-financial-freedom.jpg"
    "grandmother-grandchild-lakeside-family-legacy-planning.jpg"
    "happy-senior-couple-hiking-autumn-forest-outdoors.jpg"
    "mature-couple-bridge-waterfront-wealth-planning.jpg"
    "mountain-trail-green-meadow-peaceful-retirement-landscape.jpg"
    "retired-couple-boardwalk-meadow-mountain-adventure.jpg"
    "retired-couple-relaxing-mountain-lake-dock-capital-wealth.jpg"
    "retirement-lifestyle-capital-wealth-advisors.jpg"
    "senior-couple-mountain-overlook-retirement-planning.jpg"
)

echo ""
echo "📋 Checking for images..."
FOUND_COUNT=0
MISSING_COUNT=0

for image in "${EXPECTED_IMAGES[@]}"; do
    if [ -f "$LIFESTYLE_DIR/$image" ]; then
        echo "✅ Found: $image"
        ((FOUND_COUNT++))
    else
        echo "❌ Missing: $image"
        ((MISSING_COUNT++))
    fi
done

echo ""
echo "📊 Summary:"
echo "   Found: $FOUND_COUNT images"
echo "   Missing: $MISSING_COUNT images"
echo "   Total Expected: ${#EXPECTED_IMAGES[@]} images"

if [ $MISSING_COUNT -eq 0 ]; then
    echo ""
    echo "🎉 All lifestyle images are present!"
    echo ""
    echo "🔄 Next steps:"
    echo "   1. Update brand page to use actual image files"
    echo "   2. Test the brand page display"
    echo "   3. Commit and deploy changes"
    echo ""
    echo "To view the brand page:"
    echo "   npx eleventy --serve"
    echo "   Open: http://localhost:8080/brand/"
else
    echo ""
    echo "📥 Please download missing images from:"
    echo "   https://drive.google.com/drive/folders/1KqVVoLydT1JM65gG_xjLPQnDGhkj-91u?usp=sharing"
fi

echo ""
echo "📁 Directory structure:"
ls -la "$LIFESTYLE_DIR" 2>/dev/null || echo "   (empty - download images first)"

echo ""
echo "✨ Implementation complete!"