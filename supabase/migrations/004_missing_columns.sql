-- Sprint 2 Fix — Missing columns on skin_assessments
-- Run in Supabase SQL Editor

ALTER TABLE skin_assessments
  ADD COLUMN IF NOT EXISTS how_did_you_hear TEXT,
  ADD COLUMN IF NOT EXISTS is_flagged_for_review BOOLEAN DEFAULT FALSE;

-- Confirm
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'skin_assessments'
  AND column_name IN ('how_did_you_hear', 'is_flagged_for_review');
