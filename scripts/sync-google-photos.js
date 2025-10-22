/**
 * Sync Google Photos Album to Daily Quotes
 *
 * This script fetches photos from a specific Google Photos album
 * and updates the personal_daily_quotes table with image URLs
 *
 * Prerequisites:
 * 1. Create a Google Cloud Project
 * 2. Enable Google Photos Library API
 * 3. Create OAuth 2.0 credentials
 * 4. Download credentials.json to this directory
 *
 * Usage:
 *   node scripts/sync-google-photos.js
 */

const { google } = require('googleapis')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly']
const TOKEN_PATH = path.join(__dirname, 'google-photos-token.json')
const CREDENTIALS_PATH = path.join(__dirname, 'google-photos-credentials.json')

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Load or request authorization to call Google Photos API
 */
async function authorize() {
  let credentials
  try {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH))
  } catch (err) {
    console.error('Error loading credentials file:', err)
    console.error('\nPlease create google-photos-credentials.json in the scripts/ directory')
    console.error('See README for instructions on setting up Google Photos API')
    process.exit(1)
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

  // Check if we have a token already
  try {
    const token = fs.readFileSync(TOKEN_PATH)
    oAuth2Client.setCredentials(JSON.parse(token))
    return oAuth2Client
  } catch (err) {
    return getNewToken(oAuth2Client)
  }
}

/**
 * Get new token after prompting for user authorization
 */
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })

  console.log('Authorize this app by visiting this url:', authUrl)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close()
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject('Error retrieving access token: ' + err)
        oAuth2Client.setCredentials(token)
        // Store the token for future use
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token))
        console.log('Token stored to', TOKEN_PATH)
        resolve(oAuth2Client)
      })
    })
  })
}

/**
 * List all albums and let user choose one
 */
async function listAlbums(auth) {
  const photosLibrary = google.photoslibrary({ version: 'v1', auth })

  console.log('\nFetching your albums...\n')

  const response = await photosLibrary.albums.list({
    pageSize: 50,
  })

  const albums = response.data.albums || []

  if (albums.length === 0) {
    console.log('No albums found.')
    return null
  }

  console.log('Your albums:')
  albums.forEach((album, index) => {
    console.log(`${index + 1}. ${album.title} (${album.mediaItemsCount || 0} items)`)
  })

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question('\nEnter the number of the album you want to use: ', (answer) => {
      rl.close()
      const index = parseInt(answer) - 1
      if (index >= 0 && index < albums.length) {
        resolve(albums[index])
      } else {
        console.log('Invalid selection')
        resolve(null)
      }
    })
  })
}

/**
 * Fetch all photos from a specific album
 */
async function fetchPhotosFromAlbum(auth, albumId) {
  const photosLibrary = google.photoslibrary({ version: 'v1', auth })

  console.log('\nFetching photos from album...')

  let allPhotos = []
  let pageToken = null

  do {
    const response = await photosLibrary.mediaItems.search({
      requestBody: {
        albumId: albumId,
        pageSize: 100,
        pageToken: pageToken,
      },
    })

    const mediaItems = response.data.mediaItems || []
    allPhotos = allPhotos.concat(mediaItems)
    pageToken = response.data.nextPageToken

    console.log(`Fetched ${allPhotos.length} photos so far...`)
  } while (pageToken)

  console.log(`\nTotal photos found: ${allPhotos.length}`)
  return allPhotos
}

/**
 * Update database with photo URLs
 */
async function updateDailyQuotesWithPhotos(photos) {
  console.log('\nUpdating database...')

  // Get all existing quotes
  const { data: quotes, error: fetchError } = await supabase
    .from('personal_daily_quotes')
    .select('*')
    .order('id')

  if (fetchError) {
    console.error('Error fetching quotes:', fetchError)
    return
  }

  console.log(`Found ${quotes.length} quotes in database`)
  console.log(`Found ${photos.length} photos in album`)

  // Strategy: Randomly assign photos to quotes
  // Shuffle photos array for random distribution
  const shuffledPhotos = [...photos].sort(() => Math.random() - 0.5)

  let updatedCount = 0
  let errors = []

  for (let i = 0; i < Math.min(quotes.length, shuffledPhotos.length); i++) {
    const quote = quotes[i]
    const photo = shuffledPhotos[i]

    // Get high-quality photo URL (you can adjust =w2048-h2048 for different sizes)
    const photoUrl = `${photo.baseUrl}=w1200-h1200`

    const { error: updateError } = await supabase
      .from('personal_daily_quotes')
      .update({ image_url: photoUrl })
      .eq('id', quote.id)

    if (updateError) {
      errors.push(`Failed to update quote ${quote.id}: ${updateError.message}`)
    } else {
      updatedCount++
      console.log(`✓ Updated quote ${quote.id} with photo: ${photo.filename}`)
    }
  }

  console.log(`\n✅ Successfully updated ${updatedCount} quotes with photos`)

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`)
    errors.forEach(err => console.log(`  - ${err}`))
  }

  if (photos.length > quotes.length) {
    console.log(`\nℹ️  Note: You have ${photos.length - quotes.length} more photos than quotes.`)
    console.log('   Some photos were not used. Consider adding more quotes!')
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Google Photos to Daily Quotes Sync ===\n')

  try {
    // Authorize with Google
    const auth = await authorize()

    // List albums and let user choose
    const album = await listAlbums(auth)
    if (!album) {
      console.log('No album selected. Exiting.')
      return
    }

    console.log(`\nSelected album: ${album.title}`)

    // Fetch photos from album
    const photos = await fetchPhotosFromAlbum(auth, album.id)

    if (photos.length === 0) {
      console.log('No photos found in album. Exiting.')
      return
    }

    // Update database
    await updateDailyQuotesWithPhotos(photos)

    console.log('\n✅ Sync complete!')
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
