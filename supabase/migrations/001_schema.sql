CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT, full_name TEXT, phone TEXT,
  country TEXT DEFAULT 'Nigeria', city TEXT,
  subscription_status TEXT DEFAULT 'never'
    CHECK (subscription_status IN ('active','paused','cancelled','never','legacy_pre_assessment')),
  subscription_tier TEXT CHECK (subscription_tier IN ('essentials','full_protocol','restoration')),
  is_beta_cohort BOOLEAN DEFAULT FALSE,
  beta_cohort_number INTEGER, beta_qualified BOOLEAN DEFAULT FALSE,
  beta_qualified_at TIMESTAMPTZ, data_quality_score FLOAT DEFAULT 0,
  referral_code TEXT UNIQUE, referred_by UUID REFERENCES profiles(id),
  is_admin BOOLEAN DEFAULT FALSE
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "admins_all_profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- CITY CLIMATE MAP
CREATE TABLE city_climate_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL, country TEXT NOT NULL,
  climate_zone TEXT NOT NULL CHECK (climate_zone IN (
    'humid_tropical','semi_arid','temperate_maritime',
    'cold_continental','mediterranean','equatorial')),
  confidence TEXT DEFAULT 'mapped',
  UNIQUE(city, country)
);
ALTER TABLE city_climate_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_climate" ON city_climate_map FOR SELECT USING (TRUE);

-- FORMULA CODES
CREATE TABLE formula_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formula_code TEXT UNIQUE NOT NULL,
  profile_description TEXT,
  base_formula TEXT NOT NULL CHECK (base_formula IN (
    'lightweight_gel','medium_lotion','rich_cream','serum_base','oil_serum','exfoliant_base')),
  active_modules JSONB NOT NULL DEFAULT '[]',
  climate_zone TEXT,
  concentration_modifier TEXT DEFAULT 'standard',
  application_instructions TEXT, outcome_timeline_weeks INTEGER DEFAULT 8,
  pregnancy_safe BOOLEAN DEFAULT FALSE,
  restoration_protocol BOOLEAN DEFAULT FALSE, restoration_phase INTEGER,
  version INTEGER DEFAULT 1, chemist_approved BOOLEAN DEFAULT FALSE,
  chemist_approved_at TIMESTAMPTZ, deprecated BOOLEAN DEFAULT FALSE,
  deprecated_at TIMESTAMPTZ, rule_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE formula_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_formulas" ON formula_codes FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_formulas" ON formula_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- FORMULA PRODUCTION SPECS
CREATE TABLE formula_production_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formula_code TEXT REFERENCES formula_codes(formula_code),
  base_ingredient_id TEXT, base_volume_ml NUMERIC,
  active_modules JSONB DEFAULT '[]', mixing_order JSONB DEFAULT '[]',
  ph_target_range TEXT, preservation_system TEXT,
  batch_size_units INTEGER DEFAULT 20, stability_note TEXT,
  ingredient_cost_per_unit NUMERIC DEFAULT 0,
  packaging_cost_per_unit NUMERIC DEFAULT 0,
  production_complexity_score INTEGER DEFAULT 1,
  gross_margin_pct NUMERIC DEFAULT 0, target_margin_pct NUMERIC DEFAULT 50,
  margin_status TEXT DEFAULT 'healthy',
  temperate_base_override TEXT, cold_concentration_modifier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE formula_production_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_production_specs" ON formula_production_specs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- SKIN ASSESSMENTS
CREATE TABLE skin_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  city TEXT, country TEXT, country_of_residence TEXT, city_of_residence TEXT,
  climate_zone TEXT CHECK (climate_zone IN (
    'humid_tropical','semi_arid','temperate_maritime',
    'cold_continental','mediterranean','equatorial')),
  years_in_current_location TEXT CHECK (years_in_current_location IN (
    'less_than_1','1_to_3','more_than_3','native')),
  climate_transition_effects TEXT[] DEFAULT '{}',
  skin_type TEXT CHECK (skin_type IN ('oily','combination','normal','dry','variable')),
  fitzpatrick_estimate TEXT CHECK (fitzpatrick_estimate IN ('IV','V','VI')),
  primary_concern TEXT, secondary_concerns TEXT[] DEFAULT '{}',
  pih_duration TEXT, pih_spot_colour TEXT,
  pih_type TEXT CHECK (pih_type IN ('epidermal_likely','dermal_likely','unknown')),
  bleaching_history TEXT DEFAULT 'none' CHECK (bleaching_history IN (
    'none','historical','recent_12mo','active')),
  bleaching_cessation_effects TEXT[] DEFAULT '{}',
  pregnant_or_breastfeeding BOOLEAN DEFAULT FALSE,
  hormonal_contraception BOOLEAN DEFAULT FALSE,
  current_routine_level TEXT, gender TEXT,
  intake_photo_url TEXT, photo_consent BOOLEAN DEFAULT FALSE,
  formula_code TEXT REFERENCES formula_codes(formula_code),
  formula_rationale TEXT, base_formula TEXT,
  active_modules JSONB DEFAULT '[]', assigned_at TIMESTAMPTZ,
  confidence_score FLOAT DEFAULT 0.5,
  formula_tier TEXT DEFAULT 'standard' CHECK (formula_tier IN ('conservative','standard','optimised')),
  skin_os_score INTEGER DEFAULT 50,
  risk_score FLOAT DEFAULT 0.0,
  risk_routing TEXT DEFAULT 'autonomous',
  risk_flags JSONB DEFAULT '[]',
  predicted_week4_score FLOAT, predicted_week8_score FLOAT,
  profile_segment TEXT, rule_id_applied TEXT,
  monitoring_mode BOOLEAN DEFAULT FALSE,
  checkin_frequency TEXT DEFAULT 'standard',
  cold_start_assignment BOOLEAN DEFAULT FALSE,
  scan_data JSONB, scan_quiz_divergence BOOLEAN DEFAULT FALSE,
  exception_flag BOOLEAN DEFAULT FALSE, exception_reason TEXT,
  admin_reviewed BOOLEAN DEFAULT FALSE
);
ALTER TABLE skin_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_assessments" ON skin_assessments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admins_all_assessments" ON skin_assessments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- SKIN OUTCOMES
CREATE TABLE skin_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES skin_assessments(id),
  check_in_week INTEGER CHECK (check_in_week IN (2,4,8,12,16,24)),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  improvement_score INTEGER CHECK (improvement_score BETWEEN 1 AND 10),
  primary_concern_response TEXT, adverse_reactions BOOLEAN DEFAULT FALSE,
  adverse_detail TEXT, anything_changed BOOLEAN DEFAULT FALSE,
  change_detail TEXT, photo_url TEXT, notes TEXT,
  adherence_score_at_checkin FLOAT, new_skin_os_score INTEGER
);
ALTER TABLE skin_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_outcomes" ON skin_outcomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admins_all_outcomes" ON skin_outcomes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- REFORMULATIONS
CREATE TABLE reformulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  previous_assessment_id UUID REFERENCES skin_assessments(id),
  new_assessment_id UUID REFERENCES skin_assessments(id),
  trigger_type TEXT, change_summary TEXT,
  reformulated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reformulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_reformulations" ON reformulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins_reformulations" ON reformulations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_tier TEXT CHECK (plan_tier IN ('essentials','full_protocol','restoration')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','pending')),
  payment_method TEXT DEFAULT 'bank_transfer',
  started_at TIMESTAMPTZ DEFAULT NOW(), next_billing_date TIMESTAMPTZ,
  pause_until TIMESTAMPTZ, cancelled_at TIMESTAMPTZ, cancel_reason TEXT,
  currency TEXT DEFAULT 'NGN', monthly_amount NUMERIC
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admins_subscriptions" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  subscription_id UUID REFERENCES subscriptions(id),
  formula_code TEXT, order_number INTEGER,
  products JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment','pending_verification','confirmed',
    'pending_production','in_production','dispatched','delivered','cancelled')),
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending','pending_verification','confirmed','failed')),
  payment_reference TEXT UNIQUE,
  payment_amount NUMERIC, payment_amount_local NUMERIC,
  currency TEXT DEFAULT 'NGN', exchange_rate_to_ngn NUMERIC DEFAULT 1,
  payment_confirmed_at TIMESTAMPTZ,
  payment_confirm_token TEXT, payment_token_used BOOLEAN DEFAULT FALSE,
  customer_claimed_sent_at TIMESTAMPTZ,
  auto_confirmed BOOLEAN DEFAULT FALSE, bank_transaction_id TEXT,
  tracking_number TEXT, courier TEXT,
  shipping_type TEXT DEFAULT 'domestic',
  courier_international TEXT, international_dispatch_status TEXT,
  delivery_address JSONB, dispatch_attempts INTEGER DEFAULT 0,
  couriers_tried TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dispatched_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins_orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- BANK TRANSFER SESSIONS
CREATE TABLE bank_transfer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES profiles(id),
  amount NUMERIC NOT NULL, currency TEXT NOT NULL DEFAULT 'NGN',
  payment_reference TEXT NOT NULL UNIQUE,
  bank_name TEXT, account_name TEXT, account_number TEXT,
  sort_code TEXT, routing_number TEXT, iban TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','claimed','confirmed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bank_transfer_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_sessions" ON bank_transfer_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins_sessions" ON bank_transfer_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- UNMATCHED TRANSACTIONS
CREATE TABLE unmatched_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_transaction_id TEXT, amount NUMERIC, currency TEXT,
  narration TEXT, sender_name TEXT, sender_account TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE, resolution_notes TEXT
);
ALTER TABLE unmatched_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_unmatched" ON unmatched_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- PRODUCT VERIFICATIONS
CREATE TABLE product_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  product_type TEXT, formula_code TEXT, batch_number TEXT,
  manufactured_date DATE, nafdac_reg_number TEXT,
  ingredients JSONB DEFAULT '[]', ph_range TEXT, preservative_system TEXT,
  shelf_life_months INTEGER DEFAULT 12, qr_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE product_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_verify" ON product_verifications FOR SELECT USING (TRUE);
CREATE POLICY "admins_verifications" ON product_verifications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ROUTINE LOGS
CREATE TABLE routine_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  am_complete BOOLEAN DEFAULT FALSE, pm_complete BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, logged_at)
);
ALTER TABLE routine_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_logs" ON routine_logs FOR ALL USING (auth.uid() = user_id);

-- PRODUCTION QUEUE
CREATE TABLE production_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_at TIMESTAMPTZ DEFAULT NOW(), production_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_production','complete','dispatched')),
  batches JSONB DEFAULT '[]', total_orders_covered INTEGER DEFAULT 0,
  inventory_deductions JSONB DEFAULT '[]', units_produced INTEGER,
  completed_at TIMESTAMPTZ, confirmed_by TEXT
);
ALTER TABLE production_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_production" ON production_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- PREDICTION LOG (ML training data — starts empty)
CREATE TABLE prediction_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  assessment_id UUID REFERENCES skin_assessments(id),
  formula_code_assigned TEXT, confidence_score_at_assignment FLOAT,
  formula_tier TEXT, predicted_week4_score FLOAT, predicted_week8_score FLOAT,
  actual_week4_score FLOAT, actual_week8_score FLOAT,
  prediction_error_week4 FLOAT, prediction_error_week8 FLOAT,
  profile_segment TEXT, adherence_score_at_prediction FLOAT,
  adherence_score_at_outcome FLOAT, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE prediction_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_predictions" ON prediction_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- INGREDIENT EFFECTIVENESS (starts empty)
CREATE TABLE ingredient_effectiveness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_name TEXT NOT NULL, concentration_pct NUMERIC,
  base_formula_type TEXT, profile_segment TEXT, climate_zone TEXT,
  sample_size INTEGER DEFAULT 0, avg_improvement_score FLOAT,
  adverse_reaction_rate FLOAT, avg_time_to_result_weeks FLOAT,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ingredient_name, concentration_pct, profile_segment, climate_zone)
);
ALTER TABLE ingredient_effectiveness ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_ingredients" ON ingredient_effectiveness FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- RULE PERFORMANCE (starts empty)
CREATE TABLE rule_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id TEXT UNIQUE NOT NULL, rule_description TEXT,
  total_applications INTEGER DEFAULT 0, successful_outcomes INTEGER DEFAULT 0,
  adverse_outcomes INTEGER DEFAULT 0, failure_outcomes INTEGER DEFAULT 0,
  performance_score FLOAT DEFAULT 0, last_applied_at TIMESTAMPTZ,
  deprecated BOOLEAN DEFAULT FALSE, deprecated_at TIMESTAMPTZ,
  replacement_rule_id TEXT
);
ALTER TABLE rule_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_rules" ON rule_performance FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- FORMULA PERFORMANCE (starts empty)
CREATE TABLE formula_performance (
  formula_code TEXT PRIMARY KEY, version INTEGER DEFAULT 1,
  total_customers INTEGER DEFAULT 0, active_customers INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0, partial_success_rate FLOAT DEFAULT 0,
  failure_rate FLOAT DEFAULT 0, side_effect_rate FLOAT DEFAULT 0,
  serious_adverse_rate FLOAT DEFAULT 0, avg_improvement_score FLOAT,
  avg_time_to_first_result_days FLOAT,
  best_conditions JSONB DEFAULT '[]', worst_conditions JSONB DEFAULT '[]',
  last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE formula_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_formula_perf" ON formula_performance FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- FORMULA OUTCOME WEIGHTS (starts empty)
CREATE TABLE formula_outcome_weights (
  formula_code TEXT NOT NULL, profile_segment TEXT NOT NULL,
  sample_size INTEGER DEFAULT 0, avg_week8_score FLOAT,
  avg_week4_score FLOAT, weight_score FLOAT,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (formula_code, profile_segment)
);
ALTER TABLE formula_outcome_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_weights" ON formula_outcome_weights FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- EXPERIMENTS (starts empty)
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, status TEXT DEFAULT 'draft',
  hypothesis TEXT, start_date TIMESTAMPTZ, end_date TIMESTAMPTZ,
  target_segment TEXT, control_formula_code TEXT, variant_formula_code TEXT,
  allocation_pct INTEGER DEFAULT 30, min_sample_size INTEGER DEFAULT 50,
  control_n INTEGER DEFAULT 0, variant_n INTEGER DEFAULT 0,
  control_avg_week8 FLOAT, variant_avg_week8 FLOAT,
  statistical_significance FLOAT, conclusion TEXT,
  confound_flags JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_experiments" ON experiments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- INDEXES
CREATE INDEX idx_assessments_user ON skin_assessments(user_id);
CREATE INDEX idx_outcomes_user ON skin_outcomes(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_ref ON orders(payment_reference);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_routine_logs ON routine_logs(user_id, logged_at);
CREATE INDEX idx_prediction_formula ON prediction_log(formula_code_assigned);
CREATE INDEX idx_city_climate ON city_climate_map(city, country);
