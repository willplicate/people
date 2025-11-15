import { supabase } from '@/lib/supabase'

const BUCKET_NAME = 'daily-quote-photos'

export class DailyPhotoService {
  /**
   * Get a random photo for today
   * Uses day of year as seed to return the same photo all day
   */
  static async getDailyPhoto(): Promise<string | null> {
    try {
      // List all files in the bucket
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list()

      if (error || !files || files.length === 0) {
        console.warn('No photos found in storage bucket')
        return null
      }

      // Filter to only image files
      const photoFiles = files.filter(f =>
        /\.(jpg|jpeg|png|webp)$/i.test(f.name) && f.name !== '.emptyFolderPlaceholder'
      )

      if (photoFiles.length === 0) {
        return null
      }

      // Use day of year to deterministically pick the same photo all day
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 0)
      const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
      const index = dayOfYear % photoFiles.length

      // Get public URL for the selected photo
      const selectedFile = photoFiles[index]
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(selectedFile.name)

      return urlData.publicUrl
    } catch (err) {
      console.error('Error fetching daily photo:', err)
      return null
    }
  }

  /**
   * Get a truly random photo (not based on day)
   * Useful for testing or manual refresh
   */
  static async getRandomPhoto(): Promise<string | null> {
    try {
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list()

      if (error || !files || files.length === 0) {
        return null
      }

      const photoFiles = files.filter(f =>
        /\.(jpg|jpeg|png|webp)$/i.test(f.name) && f.name !== '.emptyFolderPlaceholder'
      )

      if (photoFiles.length === 0) {
        return null
      }

      const randomIndex = Math.floor(Math.random() * photoFiles.length)
      const selectedFile = photoFiles[randomIndex]

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(selectedFile.name)

      return urlData.publicUrl
    } catch (err) {
      console.error('Error fetching random photo:', err)
      return null
    }
  }
}
