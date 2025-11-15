# Daily Quote Photos Setup Guide

Simple guide to add photos to your dashboard. Photos rotate independently from quotes!

## Quick Start (2 Steps)

### Step 1: Create Storage Bucket in Supabase

**Option A: Via Dashboard (Easiest)**
1. Go to [Supabase Dashboard → Storage](https://supabase.com/dashboard/project/tdclhoimzksmqmnsaccw/storage/buckets)
2. Click **"New bucket"**
3. Name: `daily-quote-photos`
4. Check **"Public bucket"** ✅
5. Click **"Create bucket"**

**Option B: Via SQL**
1. Go to [SQL Editor](https://supabase.com/dashboard/project/tdclhoimzksmqmnsaccw/sql)
2. Run the script: `scripts/create-photo-storage-bucket.sql`

### Step 2: Upload Photos - That's It!

**Option A: Manual Upload (Recommended)**
1. Go to your bucket: [daily-quote-photos](https://supabase.com/dashboard/project/tdclhoimzksmqmnsaccw/storage/buckets/daily-quote-photos)
2. Click **"Upload files"**
3. Select your photos (JPG, PNG, WEBP)
4. Upload!
5. **Done!** Photos will automatically appear on your dashboard

**Option B: Bulk Upload Script**
```bash
node scripts/upload-photos.js /path/to/your/photos/folder
```

Or upload specific files:
```bash
node scripts/upload-photos.js photo1.jpg photo2.jpg photo3.jpg
```

**That's all!** No assignment script needed. Photos are completely separate from quotes.

## How It Works

**Photos and quotes are completely independent:**
- Each day shows a different quote (rotating through your 30 quotes)
- Each day shows a different photo (rotating through all photos in storage)
- They cycle separately based on the day of year

For example:
- Day 1: Quote #1 + Photo #1
- Day 2: Quote #2 + Photo #2
- Day 31: Quote #1 (cycles back) + Photo #31
- Day 32: Quote #2 + Photo #32

The photo shown is based on `day_of_year % number_of_photos`, so the same photo appears on that day consistently.

## View Your Photos

Visit your dashboard and you'll see a rotating photo next to the daily quote!

## Adding More Photos Later

Just upload more photos anytime:
1. Go to the [bucket](https://supabase.com/dashboard/project/tdclhoimzksmqmnsaccw/storage/buckets/daily-quote-photos)
2. Click **"Upload files"**
3. Upload new photos
4. **Done!** They'll automatically be included in the rotation

Or use the script:
```bash
node scripts/upload-photos.js ~/Pictures/new-photos
```

## Tips

- **Photo size**: Any size works, but 1200x1200px is optimal
- **File formats**: JPG, PNG, WEBP all supported
- **Storage limit**: 1GB free tier (hundreds of photos)
- **Upload as many as you want** - more photos = more variety!
- **No database updates needed** - just upload to storage bucket

## Troubleshooting

### No photos showing on dashboard
- Make sure bucket `daily-quote-photos` exists
- Verify bucket is set to **public**
- Check you've uploaded photos (not in subfolders)
- Look for errors in browser console (F12)

### Photos not rotating
- Make sure you have multiple photos uploaded
- Each day shows a different photo based on day of year
- Clear browser cache and refresh

## Example Workflow

```bash
# First time setup
# 1. Create bucket in Supabase Dashboard (one-time)

# 2. Upload photos (do this anytime)
# Option A: Via Supabase Dashboard
# Option B: Via script
node scripts/upload-photos.js ~/Pictures/favorites

# That's it! Photos automatically appear on dashboard
# Add more anytime by uploading more to the bucket
```

Your dashboard will now display beautiful rotating photos! 📸✨
