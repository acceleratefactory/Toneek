-- ================================================================
-- Sprint 3 Task 3.1 — Payment System Schema Migration
-- Run in Supabase SQL Editor AFTER 005_fix_constraints.sql
-- Safe to run even if tables/columns already exist from Sprint 0
-- ================================================================

-- 1. Ensure all required columns exist on orders table
--    (Most exist from Sprint 0 — IF NOT EXISTS makes this idempotent)

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS plan_tier TEXT
    CHECK (plan_tier IN ('essentials','full_protocol','restoration')),
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS payment_confirm_token TEXT,
  ADD COLUMN IF NOT EXISTS payment_token_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS customer_claimed_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_confirmed BOOLEAN DEFAULT FALSE;

-- Unique constraint on payment_reference (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders'
      AND constraint_name = 'orders_payment_reference_key'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_reference_key
      UNIQUE (payment_reference);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- 2. bank_transfer_sessions table
--    Sprint 0 schema created this — adding session_token if missing
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bank_transfer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE,
  payment_reference TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  sort_code TEXT,
  routing_number TEXT,
  iban TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','expired','claimed','confirmed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add session_token if the table already existed without it
ALTER TABLE bank_transfer_sessions
  ADD COLUMN IF NOT EXISTS session_token TEXT;

-- Unique constraint on session_token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bank_transfer_sessions'
      AND constraint_name = 'bank_transfer_sessions_session_token_key'
  ) THEN
    ALTER TABLE bank_transfer_sessions ADD CONSTRAINT bank_transfer_sessions_session_token_key
      UNIQUE (session_token);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- 3. unmatched_transactions table
--    Sprint 0 schema created this — idempotent
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS unmatched_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_transaction_id TEXT,
  amount NUMERIC,
  currency TEXT,
  narration TEXT,
  sender_name TEXT,
  sender_account TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT
);

-- ----------------------------------------------------------------
-- 4. RLS (enable + policies — safe if already enabled)
-- ----------------------------------------------------------------

ALTER TABLE bank_transfer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched_transactions ENABLE ROW LEVEL SECURITY;

-- Drop + recreate policies to avoid duplicate name errors
DROP POLICY IF EXISTS "Users read own sessions" ON bank_transfer_sessions;
DROP POLICY IF EXISTS "Admins read all sessions" ON bank_transfer_sessions;
DROP POLICY IF EXISTS "Admins read unmatched" ON unmatched_transactions;

CREATE POLICY "Users read own sessions"
  ON bank_transfer_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all sessions"
  ON bank_transfer_sessions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins read unmatched"
  ON unmatched_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ----------------------------------------------------------------
-- 5. Verify — should return 3 rows
-- ----------------------------------------------------------------

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('bank_transfer_sessions', 'unmatched_transactions', 'orders');
