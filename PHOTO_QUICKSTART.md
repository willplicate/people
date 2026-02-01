# Daily Photos - Quick Start

## What Changed?

Photos now rotate **independently** from quotes! No scripts needed - just upload and go.

## Setup (One-time)

1. **Run the SQL script** in [Supabase SQL Editor](https://supabase.com/dashboard/project/tdclhoimzksmqmnsaccw/sql):
   ```sql
   -- Copy and paste from: scripts/create-photo-storage-bucket.sql
   ```

2. **Upload photos** to [your bucket](https://supabase.com/dashboard/project/tdclhoimzksmqmnsaccw/storage/buckets/daily-quote-photos):
   - Click "Upload files"
   - Select photos
   - Done!

## How It Works

- **Quotes**: Rotate daily (30 quotes cycling)
- **Photos**: Rotate daily (all photos in storage cycling)
- **Independent**: Same day photo + different quote each year
- **Consistent**: Day 45 always shows photo #45 (wraps around if fewer photos)

## To Answer Your Questions:

### "Does it pick a random picture each day?"
Yes! Based on day of year. Same photo on same day consistently.

### "If I upload straight to storage bucket, is that enough?"
**YES!** That's all you need. No additional scripts required.

Just upload photos → they automatically appear on dashboard → rotate daily

## Adding More Photos

Upload anytime via:
1. [Supabase Dashboard](https://supabase.com/dashboard/project/tdclhoimzksmqmnsaccw/storage/buckets/daily-quote-photos) (easiest)
2. Or script: `node scripts/upload-photos.js ~/Pictures/folder`

That's it! 📸
