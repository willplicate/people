/**
 * Upload Photos to Supabase Storage
 *
 * Usage:
 *   node scripts/upload-photos.js /path/to/folder
 *   node scripts/upload-photos.js /path/to/photo1.jpg /path/to/photo2.jpg
 */
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const BUCKET_NAME = 'daily-quote-photos'

async function uploadPhoto(filepath) {
  const filename = path.basename(filepath)
  const fileBuffer = fs.readFileSync(filepath)

  // Create unique filename
  const timestamp = Date.now()
  const ext = path.extname(filename)
  const uniqueName = `photo-${timestamp}-${Math.random().toString(36).substring(7)}${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(uniqueName, fileBuffer, {
      contentType: `image/${ext.substring(1)}`,
      upsert: false
    })

  if (error) {
    throw error
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(uniqueName)

  return {
    filename: uniqueName,
    url: urlData.publicUrl
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage:')
    console.log('  node scripts/upload-photos.js /path/to/folder')
    console.log('  node scripts/upload-photos.js photo1.jpg photo2.jpg')
    process.exit(1)
  }

  console.log('=== Uploading Photos to Supabase Storage ===\n')

  let files = []

  // Check if argument is a directory or files
  for (const arg of args) {
    if (fs.statSync(arg).isDirectory()) {
      const dirFiles = fs.readdirSync(arg)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .map(f => path.join(arg, f))
      files = files.concat(dirFiles)
    } else {
      files.push(arg)
    }
  }

  if (files.length === 0) {
    console.log('❌ No image files found')
    process.exit(1)
  }

  console.log(`Found ${files.length} photos to upload\n`)

  let successCount = 0
  const uploadedUrls = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      console.log(`[${i + 1}/${files.length}] Uploading ${path.basename(file)}...`)
      const result = await uploadPhoto(file)
      console.log(`  ✅ ${result.url}`)
      uploadedUrls.push(result.url)
      successCount++
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}`)
    }
  }

  console.log(`\n✅ Successfully uploaded ${successCount}/${files.length} photos`)

  if (uploadedUrls.length > 0) {
    console.log('\n📋 Photo URLs saved to: uploaded-photos.txt')
    fs.writeFileSync('uploaded-photos.txt', uploadedUrls.join('\n'))

    console.log('\n💡 Next step: Assign photos to quotes')
    console.log('   node scripts/assign-photos-to-quotes.js')
  }
}

main()
