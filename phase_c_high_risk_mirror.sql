-- Phase C: High-Risk Mirror Database Schema

-- 1. Table to store aggregated adverse patterns
CREATE TABLE IF NOT EXISTS formula_adverse_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formula_code TEXT NOT NULL,
  profile_segment JSONB NOT NULL,
  total_prescriptions INTEGER DEFAULT 0,
  adverse_reaction_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(formula_code, profile_segment)
);

ALTER TABLE formula_adverse_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read formula adverse patterns"
  ON formula_adverse_patterns FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins manage formula adverse patterns"
  ON formula_adverse_patterns FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- 2. View to calculate risk levels automatically
CREATE OR REPLACE VIEW clinical_lookalike_risk AS
SELECT 
  id,
  formula_code,
  profile_segment,
  total_prescriptions,
  adverse_reaction_count,
  CASE 
    WHEN total_prescriptions = 0 THEN 0 
    ELSE (adverse_reaction_count::FLOAT / total_prescriptions::FLOAT) 
  END as adverse_rate,
  CASE
    WHEN total_prescriptions < 10 THEN 'insufficient_data'
    WHEN (adverse_reaction_count::FLOAT / total_prescriptions::FLOAT) >= 0.20 THEN 'high_risk'
    WHEN (adverse_reaction_count::FLOAT / total_prescriptions::FLOAT) >= 0.10 THEN 'moderate_risk'
    ELSE 'low_risk'
  END as risk_level,
  CASE 
    WHEN total_prescriptions >= 50 THEN 'high'
    WHEN total_prescriptions >= 20 THEN 'medium'
    ELSE 'low'
  END as confidence
FROM formula_adverse_patterns;
