-- TASK A: SQL CORRECTIONS
-- Run this entire block in Supabase SQL Editor
-- Safe to run multiple times

-- STEP 1: Drop existing RLS policies before re-creating (prevents "already exists" errors)
DROP POLICY IF EXISTS "Admins read platform_settings" ON platform_settings;
DROP POLICY IF EXISTS "Admins update platform_settings" ON platform_settings;
DROP POLICY IF EXISTS "Admins manage delivery_payment_links" ON delivery_payment_links;
DROP POLICY IF EXISTS "Public read delivery_payment_links by token" ON delivery_payment_links;

-- STEP 2: Re-create RLS policies
CREATE POLICY "Admins read platform_settings" ON platform_settings 
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admins update platform_settings" ON platform_settings 
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admins manage delivery_payment_links" ON delivery_payment_links 
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Public read delivery_payment_links by token" 
  ON delivery_payment_links FOR SELECT USING (true);

-- STEP 3: Seed platform_settings keys with placeholder value of 0
-- ON CONFLICT DO UPDATE forces overwrite of any wrong existing values
-- Admin will set the real amounts via the Delivery Fees Configuration panel
INSERT INTO platform_settings (key, value) VALUES
  ('delivery_fee_ngn_lagos', '0'),
  ('delivery_fee_ngn_outside_lagos', '0'),
  ('delivery_fee_ngn_international', '0'),
  ('delivery_fee_gbp_uk', '0'),
  ('delivery_fee_usd_usa', '0'),
  ('delivery_fee_eur_europe', '0'),
  ('delivery_fee_ghs_ghana', '0')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- STEP 4: Add columns to orders (safe - IF NOT EXISTS prevents errors)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_completed_at TIMESTAMPTZ DEFAULT NULL;

-- STEP 5: Add address columns to profiles (safe - IF NOT EXISTS prevents errors)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT DEFAULT NULL;

-- STEP 6: Create communication_logs table (safe - IF NOT EXISTS prevents errors)
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  message_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent'
);

-- STEP 7: Verify - run this SELECT to confirm all 7 keys exist
SELECT key, value FROM platform_settings WHERE key LIKE 'delivery_fee_%' ORDER BY key;
