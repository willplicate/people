# Netlify Environment Variables Setup

## Step-by-Step Instructions

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com/
   - Log in to your account

2. **Find Your Site**
   - Look for your deployment (should be from GitHub repo "people")
   - Click on the site name

3. **Navigate to Environment Variables**
   - Click "Site settings" (in the top navigation)
   - Click "Environment variables" (in the left sidebar)

4. **Add Environment Variables**
   Click "Add variable" and add these two:

   **Variable 1:**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://tdclhoimzksmqmnsaccw.supabase.co`

   **Variable 2:**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4`

5. **Save and Redeploy**
   - Click "Save" after adding both variables
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"

6. **Test the Site**
   - Wait for deploy to complete
   - Visit your site URL
   - Go to `/simple/`
   - Check the "Connection Info" section - both URL and Key should show "✅ Set"

## Current Issues
- Environment variables are not being read by the deployed site
- This causes "Invalid API key" errors
- The JSON parsing errors suggest fallback HTML pages are being served

## Expected Result
Once environment variables are properly set:
- No more "Invalid API key" errors
- All your CRM data (contacts, tasks, meetings) will load
- Tabbed interface will work correctly