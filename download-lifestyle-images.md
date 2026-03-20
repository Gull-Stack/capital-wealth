# Capital Wealth Lifestyle Images Download Guide

## Overview
This guide helps you download and integrate 15 professional lifestyle images from the Google Drive folder into the Capital Wealth brand page.

## Google Drive Source
**Folder URL:** https://drive.google.com/drive/folders/1KqVVoLydT1JM65gG_xjLPQnDGhkj-91u?usp=sharing

## Image List (15 Total)

### Active & Adventure (5 images)
1. `active-woman-jogging-mountain-lake-healthy-retirement.jpg`
2. `couple-hiking-alpine-hillside-active-retirement.jpg` 
3. `couple-hiking-mountain-trail-sunset-retirement-journey.jpg`
4. `happy-senior-couple-hiking-autumn-forest-outdoors.jpg`
5. `retired-couple-boardwalk-meadow-mountain-adventure.jpg`

### Peaceful & Connection (5 images)
6. `couple-holding-hands-lake-dock-retirement-together.jpg`
7. `couple-walking-waterfront-sunset-retirement-lifestyle.jpg`
8. `mature-couple-bridge-waterfront-wealth-planning.jpg`
9. `retired-couple-relaxing-mountain-lake-dock-capital-wealth.jpg`
10. `senior-couple-mountain-overlook-retirement-planning.jpg`

### Goals & Legacy (5 images)
11. `couple-mountain-summit-overlooking-valley-retirement-goals.jpg`
12. `golden-sunset-mountain-meadow-financial-freedom.jpg`
13. `grandmother-grandchild-lakeside-family-legacy-planning.jpg`
14. `mountain-trail-green-meadow-peaceful-retirement-landscape.jpg`
15. `retirement-lifestyle-capital-wealth-advisors.jpg`

## Download Instructions

### Option 1: Bulk Download (Recommended)
1. Visit the Google Drive folder
2. Click "Download all" button at the top
3. Extract the downloaded zip file
4. Move all `.jpg` files to `/assets/images/lifestyle/`

### Option 2: Individual Download
1. For each image in the list above:
   - Right-click the image in Google Drive
   - Select "Download"
   - Save to `/assets/images/lifestyle/` directory

## Directory Structure
```
capital-wealth/
├── assets/images/lifestyle/
│   ├── active-woman-jogging-mountain-lake-healthy-retirement.jpg
│   ├── couple-hiking-alpine-hillside-active-retirement.jpg
│   ├── couple-hiking-mountain-trail-sunset-retirement-journey.jpg
│   └── ... (all 15 images)
```

## File Optimization (Optional)
After downloading, optimize images for web:
```bash
# Navigate to lifestyle directory
cd assets/images/lifestyle/

# Convert to WebP format for better performance (optional)
for file in *.jpg; do
  cwebp -q 80 "$file" -o "${file%.*}.webp"
done
```

## Brand Page Integration
The brand page (`/src/brand/index.njk`) has been updated with:
- ✅ Structured layout for all 15 images
- ✅ Descriptive titles and contexts for each image
- ✅ Proper categorization (Active, Connection, Legacy)
- ✅ Visual indicators showing availability status
- ✅ Professional styling matching Capital Wealth brand

## Usage Guidelines
These lifestyle images are perfect for:
- Homepage hero backgrounds
- Service page headers
- Marketing materials
- Social media content
- Email newsletters
- Client presentations

## Next Steps
1. Download images from Google Drive
2. Place in `/assets/images/lifestyle/` directory
3. Update image paths in brand page from placeholders to actual files
4. Test the brand page display
5. Deploy updated site

---
**Note:** Images are professionally shot and optimized for financial services marketing with warm, trustworthy feeling perfect for Capital Wealth's brand identity.