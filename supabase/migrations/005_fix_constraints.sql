-- Sprint 2 Fix — Update check constraints to match Sprint 2 form values
-- Run in Supabase SQL Editor AFTER 004_missing_columns.sql

-- 1. Fix years_in_current_location
--    Old: less_than_1, 1_to_3, more_than_3, native
--    New: matches Step 1 dropdown options
ALTER TABLE skin_assessments
  DROP CONSTRAINT IF EXISTS skin_assessments_years_in_current_location_check;

ALTER TABLE skin_assessments
  ADD CONSTRAINT skin_assessments_years_in_current_location_check
  CHECK (years_in_current_location IN (
    'less_than_1_year', '1_to_3_years', '3_to_10_years',
    'more_than_10_years', 'born_here',
    -- keep old values for any legacy rows
    'less_than_1', '1_to_3', 'more_than_3', 'native'
  ));

-- 2. Fix skin_type — add 'sensitive' option (Step 3 midday-feel question)
ALTER TABLE skin_assessments
  DROP CONSTRAINT IF EXISTS skin_assessments_skin_type_check;

ALTER TABLE skin_assessments
  ADD CONSTRAINT skin_assessments_skin_type_check
  CHECK (skin_type IN ('oily', 'combination', 'normal', 'dry', 'sensitive', 'variable'));

-- 3. Fix bleaching_history — add 'unsure' option (Step 7)
ALTER TABLE skin_assessments
  DROP CONSTRAINT IF EXISTS skin_assessments_bleaching_history_check;

ALTER TABLE skin_assessments
  ADD CONSTRAINT skin_assessments_bleaching_history_check
  CHECK (bleaching_history IN (
    'none', 'historical', 'recent_12mo', 'active', 'unsure'
  ));

-- Verify: these should all return 0 rows if constraints are in place
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'skin_assessments'::regclass
  AND contype = 'c'
  AND conname IN (
    'skin_assessments_years_in_current_location_check',
    'skin_assessments_skin_type_check',
    'skin_assessments_bleaching_history_check'
  );
