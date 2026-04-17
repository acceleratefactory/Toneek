-- ================================================================
-- Sprint 4 Task 4.1 — Dashboard schema migration
-- Adds missing columns needed for check-in gating and dashboard
-- Safe to run — all additive, no destructive changes
-- ================================================================

-- 1. orders — dispatch gating columns
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS dispatch_held_reason TEXT,
  ADD COLUMN IF NOT EXISTS week4_checkin_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS week8_checkin_completed BOOLEAN DEFAULT FALSE;

-- 2. orders — add 'pending_dispatch' to status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending_payment',
    'pending_verification',
    'confirmed',
    'pending_production',
    'in_production',
    'pending_dispatch',
    'dispatched',
    'delivered',
    'cancelled'
  ));

-- 3. subscriptions — add 'cancelling' to status constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'paused', 'cancelled', 'cancelling', 'pending'));

-- 4. skin_assessments — flag_reason for reformulation review
ALTER TABLE skin_assessments
  ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- 5. skin_outcomes — check_in_channel (whatsapp / dashboard / email)
ALTER TABLE skin_outcomes
  ADD COLUMN IF NOT EXISTS check_in_channel TEXT
    CHECK (check_in_channel IN ('whatsapp', 'dashboard', 'email', 'manual'));

-- 6. skin_assessments — email for anonymous user lookup
--    (used when user hasn't confirmed magic link yet)
ALTER TABLE skin_assessments
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Verify
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'orders'
     AND column_name IN ('dispatch_held_reason','week4_checkin_completed','week8_checkin_completed'))
   AS orders_cols_added,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'skin_outcomes'
     AND column_name = 'check_in_channel')
   AS outcomes_channel_added,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'skin_assessments'
     AND column_name IN ('flag_reason','email'))
   AS assessments_cols_added;
-- Should return: orders_cols_added=3, outcomes_channel_added=1, assessments_cols_added=2
