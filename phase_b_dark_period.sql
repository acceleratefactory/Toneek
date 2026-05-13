-- Dark period responses table
CREATE TABLE IF NOT EXISTS dark_period_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number IN (1, 3, 5)),
  response TEXT NOT NULL CHECK (response IN ('happy', 'neutral', 'concerned')),
  response_channel TEXT DEFAULT 'whatsapp' CHECK (response_channel IN ('whatsapp', 'dashboard')),
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  admin_alerted BOOLEAN DEFAULT FALSE,
  admin_alert_dismissed BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, day_number)
);

ALTER TABLE dark_period_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own dark period responses"
  ON dark_period_responses FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins read all dark period responses"
  ON dark_period_responses FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Update RLS for update access by admins if they need to dismiss alerts
CREATE POLICY "Admins update dark period responses"
  ON dark_period_responses FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
