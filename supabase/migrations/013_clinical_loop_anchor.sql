-- 013_clinical_loop_anchor.sql
-- De-couples the clinical loop timeline from the billing/order cycle

-- 1. Add the clinical loop anchor to skin_assessments
ALTER TABLE skin_assessments
  ADD COLUMN IF NOT EXISTS formula_received_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add the clinical loop anchor to profiles (for quick access)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS formula_received_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Backfill formula_received_at for existing assessments
-- Find the earliest delivered order for each assessment's user that occurred AFTER the assessment was assigned
UPDATE skin_assessments sa
SET formula_received_at = (
  SELECT o.received_at FROM orders o
  WHERE o.user_id = sa.user_id
  AND o.received_at IS NOT NULL
  AND o.created_at >= sa.created_at
  ORDER BY o.received_at ASC
  LIMIT 1
)
WHERE sa.formula_received_at IS NULL;

-- 4. Backfill profiles with their most recent assessment's formula_received_at
UPDATE profiles p
SET formula_received_at = (
  SELECT sa.formula_received_at FROM skin_assessments sa
  WHERE sa.user_id = p.id
  AND sa.formula_received_at IS NOT NULL
  ORDER BY sa.created_at DESC
  LIMIT 1
)
WHERE p.formula_received_at IS NULL;
