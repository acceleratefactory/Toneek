-- Migration: Add nurture tracking columns to skin_assessments
-- This supports the 60-day resubscription logic seamlessly by tracking
-- the nurture email state per assessment rather than per profile.

ALTER TABLE public.skin_assessments
ADD COLUMN IF NOT EXISTS nurture_day1_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS nurture_day3_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS nurture_day7_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS nurture_day14_sent boolean DEFAULT false;

-- Add an index on created_at to speed up the daily cron job query
CREATE INDEX IF NOT EXISTS idx_skin_assessments_created_at 
ON public.skin_assessments (created_at DESC);
