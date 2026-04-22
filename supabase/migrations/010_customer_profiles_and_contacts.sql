-- Migration 010: Add Custom Contacts & Avatars
-- Safely modifies existing tables without affecting table rows

-- Add columns directly to Skin Assessments explicitly
ALTER TABLE skin_assessments 
  ADD COLUMN IF NOT EXISTS full_name TEXT, 
  ADD COLUMN IF NOT EXISTS phone TEXT, 
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add tracking columns explicitly to Profiles
-- Note: 'full_name' and 'phone' are natively mapped in 001_schema.sql
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
