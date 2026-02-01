# Google Photos Sync Setup

This guide will help you sync photos from a Google Photos album to display in your Dashboard's welcome section.

## Overview

The `sync-google-photos.js` script will:
1. Connect to your Google Photos account
2. Let you choose an album
3. Fetch all photo URLs from that album
4. Randomly assign them to your daily quotes in the database

## Prerequisites

1. A Google Photos album with your favorite memories
2. Node.js installed (you already have this)
3. Your Supabase credentials (already in `.env.local`)

## Setup Steps

### Step 1: Create Google Cloud Project & Enable API

1. Go to [Google Cloud Console](https://coWnsole.cloud.google.com/)
2. Create a new project (or use existing one)
3. Click **"Enable APIs and Services"**
4. Search for **"Photos Library API"**
5. Click **Enable**

### Step 2: Create OAuth 2.0 Credentials

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: `Personal CRM Photos`
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** (skip scopes for now)
   - Add yourself as a test user
4. Back in Credentials, click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Choose **"Desktop app"**
6. Name it: `Personal CRM Photos Desktop`
7. Click **Create**
8. Click **"Download JSON"**
9. Rename the downloaded file to `google-photos-credentials.json`
10. Move it to the `scripts/` directory in your project

### Step 3: Create Your Google Photos Album

1. Go to [Google Photos](https://photos.google.com)
2. Create a new album (e.g., "Dashboard Memories")
3. Add all the photos you want to display (can be hundreds!)
4. Don't worry about making it public - the script will use your personal access

### Step 4: Run the Sync Script

```bash
cd /Users/williamford/people/personal-crm
node scripts/sync-google-photos.js
```

### First Run - What to Expect

1. The script will open a browser window asking you to authorize
2. Sign in with your Google account
3. Click **"Allow"**
4. Copy the authorization code
5. Paste it into the terminal
6. The script will show you a list of your albums
7. Choose the number of your "Dashboard Memories" album
8. The script will:
   - Fetch all photos from the album
   - Randomly assign them to your quotes
   - Update the database
   - Show you progress as it goes

### Subsequent Runs

After the first run, the script saves your authorization token. You can:
- Run it anytime to refresh the photos
- Change albums by selecting a different number
- Add more photos to your album and re-run to update

## Usage Examples

### Example 1: First Time Setup
```bash
$ node scripts/sync-google-photos.js

=== Google Photos to Daily Quotes Sync ===

Authorize this app by visiting this url: https://accounts.google.com/o/oauth2/...
Enter the code from that page here: 4/0AY0e-g7...

Fetching your albums...

Your albums:
1. Family Vacation 2024 (156 items)
2. Dashboard Memories (234 items)
3. Random Photos (89 items)

Enter the number of the album you want to use: 2

Selected album: Dashboard Memories

Fetching photos from album...
Fetched 100 photos so far...
Fetched 200 photos so far...
Fetched 234 photos so far...

Total photos found: 234

Updating database...
Found 30 quotes in database
Found 234 photos in album

✓ Updated quote 1 with photo: IMG_1234.jpg
✓ Updated quote 2 with photo: IMG_5678.jpg
...

✅ Successfully updated 30 quotes with photos

ℹ️  Note: You have 204 more photos than quotes.
   Some photos were not used. Consider adding more quotes!

✅ Sync complete!
```

### Example 2: Refresh Photos
Just run the script again to shuffle and reassign photos:
```bash
node scripts/sync-google-photos.js
```

## How It Works

1. **Random Distribution**: Photos are randomly shuffled and assigned to quotes
2. **High Quality URLs**: Photos are fetched at 1200x1200 resolution
3. **Direct Links**: URLs point directly to Google's servers (no download needed)
4. **Persistent**: URLs remain valid as long as you don't delete the photos

## Troubleshooting

### "Error loading credentials file"
- Make sure `google-photos-credentials.json` is in the `scripts/` directory
- Check that you downloaded the OAuth client credentials (not API key)

### "No albums found"
- Make sure you've created at least one album in Google Photos
- Try refreshing your Google Photos page

### "Failed to update quote"
- Check your `.env.local` has the correct Supabase credentials
- Make sure you've run the `create-daily-quotes-table.sql` migration

### Photos not displaying on site
- The URLs from Google Photos require authentication for some accounts
- If this happens, consider using a public Google Photos shared album instead
- Or use Supabase Storage (recommended for best performance)

## Alternative: Supabase Storage

If Google Photos URLs don't work for your setup, you can:
1. Download photos from your album
2. Upload to Supabase Storage (see main README)
3. Use those URLs instead

This gives you full control and guaranteed availability.

## Tips

- **Organize by theme**: Create different albums for different moods/seasons
- **Update regularly**: Run the script monthly to refresh with new photos
- **Backup important photos**: Keep copies in multiple locations
- **Add more quotes**: The more quotes you have, the more photos will be used

## Questions?

- Check if Google Photos Library API is enabled
- Verify OAuth credentials are for "Desktop app" type
- Make sure you're using the same Google account for photos and API
