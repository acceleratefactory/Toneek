-- Add to skin_assessments or create a new table for clinical notes
CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id),
  note_text TEXT NOT NULL,
  note_type TEXT DEFAULT 'manual' CHECK (note_type IN ('manual', 'ai_drafted', 'ai_approved')),
  ai_draft_input JSONB DEFAULT NULL,    -- stores what was sent to Claude/Gemini API
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ DEFAULT NULL,     -- null until admin approves and sends
  sent_via TEXT DEFAULT NULL            -- 'email' | 'whatsapp' | 'both'
);

ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage clinical notes"
  ON clinical_notes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Users read their own notes"
  ON clinical_notes FOR SELECT USING (auth.uid() = user_id);
