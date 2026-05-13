-- ============================================================
-- Phase I: Clinical Governance — Task A Migration
-- Add clinical review fields to concern_reports table
-- Run this ONCE in the Supabase SQL Editor
-- ============================================================

-- Step 1: Add the review_status column
-- Default is 'pending_review' for all NEW concern reports going forward
ALTER TABLE concern_reports
ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending_review'
CHECK (review_status IN ('pending_review', 'confirmed_incompatibility', 'released_protocol_failure'));

-- Step 2: Add the admin clinical note column
-- Required when an admin releases a hold (user error scenario)
ALTER TABLE concern_reports
ADD COLUMN IF NOT EXISTS admin_clinical_note TEXT;

-- Step 3: Add the reviewed_by column
-- Records which admin made the clinical decision (references auth users)
ALTER TABLE concern_reports
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Step 4: Add the reviewed_at timestamp
-- Records when the clinical decision was made
ALTER TABLE concern_reports
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- ============================================================
-- Step 5: Backfill existing rows
-- All EXISTING concern reports were previously treated as
-- permanent blacklists. We mark them as 'confirmed_incompatibility'
-- so they are not re-opened as "Pending Review" incorrectly.
-- ============================================================
UPDATE concern_reports
SET review_status = 'confirmed_incompatibility'
WHERE review_status = 'pending_review';

-- ============================================================
-- Step 6: Verify the changes
-- Run this SELECT to confirm the columns exist correctly
-- ============================================================
SELECT
  id,
  user_id,
  formula_code,
  review_status,
  admin_clinical_note,
  reviewed_by,
  reviewed_at
FROM concern_reports
LIMIT 5;

