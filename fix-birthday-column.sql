-- Fix birthday column to accept MM-DD format instead of full dates
-- Run this in Supabase SQL Editor

ALTER TABLE personal_contacts
ALTER COLUMN birthday TYPE VARCHAR(5);