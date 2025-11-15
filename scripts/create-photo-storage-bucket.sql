-- Create Storage Bucket for Daily Quote Photos
-- Run this in your Supabase SQL Editor

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-quote-photos', 'daily-quote-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public reading
CREATE POLICY "Public Access to Photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'daily-quote-photos');

-- Create policy to allow authenticated uploads (if needed later)
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'daily-quote-photos' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated deletions (if needed later)
CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'daily-quote-photos' AND auth.role() = 'authenticated');
