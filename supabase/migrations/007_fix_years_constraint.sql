-- Sprint 2 Fix — Align years_in_current_location constraint with Step 1 actual form values
-- Step 1 uses: 'less_than_1', '1_to_3', '3_to_10', 'more_than_10', 'born_here'
-- Run in Supabase SQL Editor

ALTER TABLE skin_assessments
  DROP CONSTRAINT IF EXISTS skin_assessments_years_in_current_location_check;

ALTER TABLE skin_assessments
  ADD CONSTRAINT skin_assessments_years_in_current_location_check
  CHECK (years_in_current_location IN (
    -- Current Step 1 form values
    'less_than_1',
    '1_to_3',
    '3_to_10',
    'more_than_10',
    'born_here',
    -- Sprint 0 legacy values (keep for backward compatibility)
    'less_than_1_year',
    '1_to_3_years',
    '3_to_10_years',
    'more_than_10_years',
    'more_than_3',
    'native'
  ));

-- Verify
SELECT conname FROM pg_constraint
WHERE conrelid = 'skin_assessments'::regclass
  AND conname = 'skin_assessments_years_in_current_location_check';
