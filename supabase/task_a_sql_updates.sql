-- STEP 1: Verify platform_settings has data (if empty, the insert below will seed it)
INSERT INTO platform_settings (key, value) VALUES
  ('delivery_fee_ngn_lagos', '3500'),
  ('delivery_fee_ngn_outside_lagos', '5500'),
  ('delivery_fee_ngn_international', '8000'),
  ('delivery_fee_gbp_uk', '5'),
  ('delivery_fee_usd_usa', '8'),
  ('delivery_fee_eur_europe', '7'),
  ('delivery_fee_ghs_ghana', '45')
ON CONFLICT (key) DO NOTHING;

-- STEP 2: Add RLS policies for platform_settings
CREATE POLICY "Admins read platform_settings" ON platform_settings 
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admins update platform_settings" ON platform_settings 
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- STEP 3: Add RLS policies for delivery_payment_links
CREATE POLICY "Admins manage delivery_payment_links" ON delivery_payment_links 
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Public read delivery_payment_links by token" 
  ON delivery_payment_links FOR SELECT USING (true);

-- STEP 4: Add production_completed_at to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_completed_at TIMESTAMPTZ DEFAULT NULL;

-- STEP 5: Add address columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT DEFAULT NULL;

-- STEP 6: Create communication_logs table
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  message_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent'
);
