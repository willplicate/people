/**
 * Setup Supabase Storage for Daily Quote Photos
 *
 * This script creates the storage bucket and sets up policies
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const BUCKET_NAME = 'daily-quote-photos'

async function setupStorage() {
  console.log('=== Setting up Supabase Storage for Photos ===\n')

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (bucketExists) {
      console.log(`✅ Bucket "${BUCKET_NAME}" already exists`)
    } else {
      // Create bucket
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      })

      if (error) {
        throw new Error(`Failed to create bucket: ${error.message}`)
      }

      console.log(`✅ Created bucket "${BUCKET_NAME}"`)
    }

    console.log('\n📋 Next Steps:')
    console.log('1. Upload photos manually via Supabase Dashboard:')
    console.log(`   https://supabase.com/dashboard/project/tdclhoimzksmqmnsaccw/storage/buckets/${BUCKET_NAME}`)
    console.log('\n2. Or use the upload script:')
    console.log('   node scripts/upload-photos.js /path/to/your/photos')
    console.log('\n3. Then assign photos to quotes:')
    console.log('   node scripts/assign-photos-to-quotes.js')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

setupStorage()
