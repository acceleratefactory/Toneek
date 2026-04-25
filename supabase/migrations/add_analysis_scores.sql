-- Migration: Add analysis_scores columns to skin_assessments
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to re-run — uses IF NOT EXISTS

ALTER TABLE skin_assessments
  ADD COLUMN IF NOT EXISTS analysis_scores JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS photo_analysis_scores JSONB DEFAULT NULL;

-- analysis_scores stores the 8 calculated scores, e.g.:
-- {
--   "pigmentation_load": 62,
--   "barrier_integrity": 85,
--   "oil_balance": 42,
--   "inflammation_level": 58,
--   "hydration_status": 71,
--   "melanin_sensitivity": 73,
--   "treatment_tolerance": 68,
--   "climate_stress": 45
-- }

-- photo_analysis_scores is NULL until Haut.AI integration is live.
-- No action needed on this column for now.
