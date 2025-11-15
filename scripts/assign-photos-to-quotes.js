/**
 * Assign Photos to Daily Quotes
 *
 * This script randomly assigns photos from Supabase Storage to your daily quotes
 *
 * Usage:
 *   node scripts/assign-photos-to-quotes.js
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const BUCKET_NAME = 'daily-quote-photos'

async function main() {
  console.log('=== Assigning Photos to Daily Quotes ===\n')

  try {
    // Get all photos from storage
    const { data: files, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .list()

    if (storageError) {
      throw new Error(`Failed to list photos: ${storageError.message}`)
    }

    if (!files || files.length === 0) {
      console.log('❌ No photos found in storage')
      console.log('\n💡 First upload some photos:')
      console.log('   node scripts/upload-photos.js /path/to/photos')
      return
    }

    // Filter out non-image files and get public URLs
    const photoFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
    const photoUrls = photoFiles.map(f => {
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(f.name)
      return data.publicUrl
    })

    console.log(`📸 Found ${photoUrls.length} photos in storage`)

    // Get all quotes
    const { data: quotes, error: quotesError } = await supabase
      .from('personal_daily_quotes')
      .select('id, quote_text, author')
      .eq('is_active', true)
      .order('id')

    if (quotesError) {
      throw new Error(`Failed to fetch quotes: ${quotesError.message}`)
    }

    console.log(`📝 Found ${quotes.length} active quotes\n`)

    // Shuffle photos for random assignment
    const shuffledPhotos = [...photoUrls].sort(() => Math.random() - 0.5)

    let updatedCount = 0

    for (let i = 0; i < quotes.length; i++) {
      const quote = quotes[i]
      const photoUrl = shuffledPhotos[i % shuffledPhotos.length] // Cycle through photos if more quotes than photos

      const { error: updateError } = await supabase
        .from('personal_daily_quotes')
        .update({ image_url: photoUrl })
        .eq('id', quote.id)

      if (updateError) {
        console.log(`❌ Failed to update quote ${quote.id}: ${updateError.message}`)
      } else {
        console.log(`✅ Quote ${i + 1}: "${quote.quote_text.substring(0, 40)}..." → Photo assigned`)
        updatedCount++
      }
    }

    console.log(`\n✅ Successfully assigned photos to ${updatedCount}/${quotes.length} quotes`)

    if (photoUrls.length < quotes.length) {
      console.log(`\nℹ️  Note: You have ${quotes.length} quotes but only ${photoUrls.length} photos.`)
      console.log('   Photos will be reused. Upload more photos for variety!')
    }

    console.log('\n🎉 Done! Check your dashboard to see the photos.')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
