-- ============================================================
-- TASK 0.4 — SEED DATA
-- Run this in Supabase SQL Editor AFTER 001_schema.sql
-- ============================================================

-- City Climate Map (60+ cities across all 6 climate zones)
INSERT INTO city_climate_map (city, country, climate_zone) VALUES
('Lagos','Nigeria','humid_tropical'),
('Abuja','Nigeria','semi_arid'),
('Port Harcourt','Nigeria','humid_tropical'),
('Kano','Nigeria','semi_arid'),
('Ibadan','Nigeria','humid_tropical'),
('Kaduna','Nigeria','semi_arid'),
('Jos','Nigeria','semi_arid'),
('Enugu','Nigeria','humid_tropical'),
('Benin City','Nigeria','humid_tropical'),
('Warri','Nigeria','humid_tropical'),
('Calabar','Nigeria','equatorial'),
('Maiduguri','Nigeria','semi_arid'),
('Accra','Ghana','humid_tropical'),
('Kumasi','Ghana','humid_tropical'),
('Tamale','Ghana','semi_arid'),
('London','United Kingdom','temperate_maritime'),
('Birmingham','United Kingdom','temperate_maritime'),
('Manchester','United Kingdom','temperate_maritime'),
('Leeds','United Kingdom','temperate_maritime'),
('Glasgow','United Kingdom','temperate_maritime'),
('Bristol','United Kingdom','temperate_maritime'),
('New York','United States','cold_continental'),
('Atlanta','United States','humid_tropical'),
('Houston','United States','humid_tropical'),
('Washington DC','United States','cold_continental'),
('Chicago','United States','cold_continental'),
('Los Angeles','United States','mediterranean'),
('Miami','United States','humid_tropical'),
('Dallas','United States','humid_tropical'),
('Philadelphia','United States','cold_continental'),
('Boston','United States','cold_continental'),
('Toronto','Canada','cold_continental'),
('Montreal','Canada','cold_continental'),
('Vancouver','Canada','temperate_maritime'),
('Amsterdam','Netherlands','temperate_maritime'),
('Paris','France','temperate_maritime'),
('Dublin','Ireland','temperate_maritime'),
('Berlin','Germany','cold_continental'),
('Brussels','Belgium','temperate_maritime'),
('Stockholm','Sweden','cold_continental'),
('Oslo','Norway','cold_continental'),
('Madrid','Spain','mediterranean'),
('Barcelona','Spain','mediterranean'),
('Johannesburg','South Africa','semi_arid'),
('Cape Town','South Africa','mediterranean'),
('Durban','South Africa','humid_tropical'),
('Nairobi','Kenya','semi_arid'),
('Kampala','Uganda','humid_tropical'),
('Dar es Salaam','Tanzania','equatorial'),
('Dakar','Senegal','semi_arid'),
('Freetown','Sierra Leone','equatorial'),
('Douala','Cameroon','equatorial'),
('Kinshasa','DR Congo','equatorial'),
('Abidjan','Cote dIvoire','humid_tropical'),
('Dubai','UAE','semi_arid'),
('Abu Dhabi','UAE','semi_arid'),
('Riyadh','Saudi Arabia','semi_arid'),
('Kingston','Jamaica','humid_tropical'),
('Port of Spain','Trinidad','humid_tropical'),
('Sydney','Australia','mediterranean'),
('Melbourne','Australia','temperate_maritime'),
('Brisbane','Australia','humid_tropical')
ON CONFLICT (city, country) DO NOTHING;

-- ============================================================
-- Formula Codes — all 30
-- ============================================================
INSERT INTO formula_codes (
  formula_code, profile_description, base_formula, active_modules,
  climate_zone, outcome_timeline_weeks, pregnancy_safe,
  restoration_protocol, restoration_phase, version, chemist_approved
) VALUES

-- Lagos / Humid Tropical formulas
('LG-OA-01','Lagos / Oily / Acne','lightweight_gel',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Regulates sebum and blocks melanin transfer"},{"name":"Salicylic Acid","concentration":2,"unit":"%","rationale":"Oil-soluble penetration into follicle wall"},{"name":"Azelaic Acid","concentration":10,"unit":"%","rationale":"Anti-acne and tyrosinase inhibition combined"}]',
'humid_tropical',8,false,false,null,1,false),

('LG-OB-01','Lagos / Oily / PIH','lightweight_gel',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Blocks melanin transfer at cellular level"},{"name":"Azelaic Acid","concentration":15,"unit":"%","rationale":"Tyrosinase inhibition without irritation"},{"name":"Kojic Acid Complex","concentration":2,"unit":"%","rationale":"Melanin inhibition, stabilised for tropical heat"}]',
'humid_tropical',8,false,false,null,1,false),

('LG-CA-01','Lagos / Combination / Acne','medium_lotion',
'[{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Sebum regulation and barrier support"},{"name":"Salicylic Acid","concentration":1.5,"unit":"%","rationale":"Pore congestion treatment"},{"name":"Azelaic Acid","concentration":10,"unit":"%","rationale":"Anti-inflammatory and anti-acne"}]',
'humid_tropical',8,false,false,null,1,false),

('LG-CB-01','Lagos / Combination / PIH','medium_lotion',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Melanin transfer inhibition"},{"name":"Tranexamic Acid","concentration":3,"unit":"%","rationale":"Melanin pathway interruption, safe for all tones"},{"name":"Azelaic Acid","concentration":10,"unit":"%","rationale":"Tyrosinase inhibition"}]',
'humid_tropical',10,false,false,null,1,false),

('LG-DB-01','Lagos / Dry / PIH','rich_cream',
'[{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Gentle melanin inhibition for dry skin"},{"name":"Tranexamic Acid","concentration":5,"unit":"%","rationale":"Strong PIH treatment without irritation"},{"name":"Bakuchiol","concentration":1,"unit":"%","rationale":"Retinol-equivalent without photosensitivity"}]',
'humid_tropical',10,false,false,null,1,false),

('LG-DH-01','Lagos / Dry / Dryness','rich_cream',
'[{"name":"Centella Asiatica Complex","concentration":2,"unit":"%","rationale":"Barrier repair and inflammation calming"},{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Barrier support and ceramide production"},{"name":"Bakuchiol","concentration":1,"unit":"%","rationale":"Skin renewal without irritation"}]',
'humid_tropical',8,false,false,null,1,false),

('LG-OH-01','Lagos / Oily / Oiliness','lightweight_gel',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Sebum regulation"},{"name":"Salicylic Acid","concentration":2,"unit":"%","rationale":"Pore clearing and sebum control"}]',
'humid_tropical',6,false,false,null,1,false),

-- Abuja / Semi-Arid formulas
('AB-OA-01','Abuja / Oily / Acne','lightweight_gel',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Sebum regulation and PIH prevention"},{"name":"Salicylic Acid","concentration":2,"unit":"%","rationale":"Oil-soluble acne treatment"},{"name":"Azelaic Acid","concentration":10,"unit":"%","rationale":"Anti-acne and anti-inflammatory"}]',
'semi_arid',8,false,false,null,1,false),

('AB-OB-01','Abuja / Oily / PIH','medium_lotion',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Melanin transfer inhibition"},{"name":"Azelaic Acid","concentration":15,"unit":"%","rationale":"Tyrosinase inhibition"},{"name":"Tranexamic Acid","concentration":3,"unit":"%","rationale":"Additional melanin pathway block"}]',
'semi_arid',10,false,false,null,1,false),

('AB-DB-01','Abuja / Dry / PIH','rich_cream',
'[{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Gentle PIH treatment"},{"name":"Tranexamic Acid","concentration":5,"unit":"%","rationale":"Strong PIH without irritation"},{"name":"Centella Asiatica Complex","concentration":2,"unit":"%","rationale":"Barrier repair for harmattan dryness"}]',
'semi_arid',10,false,false,null,1,false),

('AB-DH-01','Abuja / Dry / Dryness','rich_cream',
'[{"name":"Centella Asiatica Complex","concentration":2,"unit":"%","rationale":"Barrier repair critical in harmattan"},{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Ceramide production boost"},{"name":"Bakuchiol","concentration":2,"unit":"%","rationale":"Skin renewal with barrier support"}]',
'semi_arid',8,false,false,null,1,false),

-- General / Climate-Agnostic formulas
('GN-CA-01','General / Combination / Acne','medium_lotion',
'[{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Oil regulation and barrier support"},{"name":"Salicylic Acid","concentration":1.5,"unit":"%","rationale":"Pore clearing"},{"name":"Azelaic Acid","concentration":10,"unit":"%","rationale":"Anti-acne treatment"}]',
null,8,false,false,null,1,false),

('GN-CB-01','General / Combination / PIH','medium_lotion',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Melanin transfer inhibition"},{"name":"Tranexamic Acid","concentration":3,"unit":"%","rationale":"Melanin pathway interruption"},{"name":"Kojic Acid Complex","concentration":1,"unit":"%","rationale":"Additional brightening support"}]',
null,10,false,false,null,1,false),

('GN-NB-01','General / Normal / PIH','medium_lotion',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Primary PIH treatment"},{"name":"Tranexamic Acid","concentration":5,"unit":"%","rationale":"Strong PIH for normal skin"},{"name":"Ascorbyl Glucoside","concentration":2,"unit":"%","rationale":"Stable vitamin C for brightening"}]',
null,10,false,false,null,1,false),

('GN-NT-01','General / Normal / Texture','medium_lotion',
'[{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Pore refinement and texture"},{"name":"Bakuchiol","concentration":2,"unit":"%","rationale":"Retinol-equivalent skin renewal"},{"name":"Azelaic Acid","concentration":10,"unit":"%","rationale":"Texture and tone improvement"}]',
null,8,false,false,null,1,false),

('GN-DH-01','General / Dry / Dryness','rich_cream',
'[{"name":"Centella Asiatica Complex","concentration":2,"unit":"%","rationale":"Barrier repair"},{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Ceramide synthesis support"},{"name":"Bakuchiol","concentration":1,"unit":"%","rationale":"Gentle skin renewal"}]',
null,8,false,false,null,1,false),

('GN-OT-01','General / Oily / Texture','lightweight_gel',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Pore refinement and sebum control"},{"name":"Salicylic Acid","concentration":1.5,"unit":"%","rationale":"Texture improvement"},{"name":"Azelaic Acid","concentration":10,"unit":"%","rationale":"Skin refinement"}]',
null,8,false,false,null,1,false),

-- Restoration Protocol — Humid Tropical (phased)
('RP-HT-01','Restoration / Humid Tropical / Phase 1','rich_cream',
'[{"name":"Centella Asiatica Complex","concentration":3,"unit":"%","rationale":"Barrier repair - primary phase 1 active"},{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Gentle barrier support without irritation"}]',
'humid_tropical',4,false,true,1,1,false),

('RP-HT-02','Restoration / Humid Tropical / Phase 2','rich_cream',
'[{"name":"Centella Asiatica Complex","concentration":2,"unit":"%","rationale":"Continued barrier support"},{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Barrier and gentle brightening"},{"name":"Tranexamic Acid","concentration":3,"unit":"%","rationale":"Introducing gentle brightening as barrier stabilises"}]',
'humid_tropical',8,false,true,2,1,false),

('RP-HT-03','Restoration / Humid Tropical / Phase 3','medium_lotion',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Full melanin transfer inhibition"},{"name":"Tranexamic Acid","concentration":5,"unit":"%","rationale":"Active PIH treatment"},{"name":"Bakuchiol","concentration":1,"unit":"%","rationale":"Skin renewal - barrier now stable"}]',
'humid_tropical',12,false,true,3,1,false),

-- Restoration Protocol — Semi-Arid (phased)
('RP-SA-01','Restoration / Semi-Arid / Phase 1','rich_cream',
'[{"name":"Centella Asiatica Complex","concentration":3,"unit":"%","rationale":"Barrier repair in dry climate"},{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Gentle barrier support"}]',
'semi_arid',4,false,true,1,1,false),

('RP-SA-02','Restoration / Semi-Arid / Phase 2','rich_cream',
'[{"name":"Centella Asiatica Complex","concentration":2,"unit":"%","rationale":"Continued barrier repair"},{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Barrier support"},{"name":"Tranexamic Acid","concentration":3,"unit":"%","rationale":"Gentle brightening introduction"}]',
'semi_arid',8,false,true,2,1,false),

('RP-SA-03','Restoration / Semi-Arid / Phase 3','rich_cream',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Full treatment"},{"name":"Tranexamic Acid","concentration":5,"unit":"%","rationale":"Active PIH treatment"},{"name":"Bakuchiol","concentration":2,"unit":"%","rationale":"Skin renewal - higher for dry climate"}]',
'semi_arid',12,false,true,3,1,false),

-- Pregnancy-Safe formulas
('PG-GN-01','Pregnancy-Safe / General','medium_lotion',
'[{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Safe during pregnancy, melanin inhibition"},{"name":"Tranexamic Acid","concentration":3,"unit":"%","rationale":"Safe brightening for pregnancy-related melasma"},{"name":"Centella Asiatica Complex","concentration":2,"unit":"%","rationale":"Barrier support, safe in pregnancy"}]',
null,12,true,false,null,1,false),

('PG-DH-01','Pregnancy-Safe / Dry','rich_cream',
'[{"name":"Centella Asiatica Complex","concentration":2,"unit":"%","rationale":"Barrier repair, pregnancy-safe"},{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Hydration and gentle brightening, safe in pregnancy"}]',
null,10,true,false,null,1,false),

-- Male formulas
('M-OA-01','Male / Oily / Razor Bumps','lightweight_gel',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Reduces razor bump hyperpigmentation"},{"name":"Azelaic Acid","concentration":15,"unit":"%","rationale":"Anti-inflammatory for pseudofolliculitis barbae"},{"name":"Salicylic Acid","concentration":2,"unit":"%","rationale":"Prevents ingrown hairs"}]',
null,8,false,false,null,1,false),

('M-OB-01','Male / Oily / Beard PIH','lightweight_gel',
'[{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Beard area PIH treatment"},{"name":"Tranexamic Acid","concentration":3,"unit":"%","rationale":"Targeted melanin inhibition"},{"name":"Azelaic Acid","concentration":10,"unit":"%","rationale":"Anti-inflammatory for beard area"}]',
null,8,false,false,null,1,false),

('M-CA-01','Male / Combination / Acne','medium_lotion',
'[{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Oil regulation"},{"name":"Salicylic Acid","concentration":1.5,"unit":"%","rationale":"Acne treatment"},{"name":"Azelaic Acid","concentration":10,"unit":"%","rationale":"Anti-acne and anti-inflammatory"}]',
null,8,false,false,null,1,false),

-- Specialist formulas
('GN-AG-01','General / Ageing / Texture','serum_base',
'[{"name":"Bakuchiol","concentration":2,"unit":"%","rationale":"Retinol-equivalent anti-ageing without photosensitivity"},{"name":"Niacinamide","concentration":10,"unit":"%","rationale":"Fine lines and uneven texture"},{"name":"Peptide Blend","concentration":1,"unit":"%","rationale":"Collagen support"}]',
null,12,false,false,null,1,false),

('GN-SN-01','General / Sensitive / No Concern','medium_lotion',
'[{"name":"Centella Asiatica Complex","concentration":2,"unit":"%","rationale":"Calming and barrier support for sensitive skin"},{"name":"Niacinamide","concentration":5,"unit":"%","rationale":"Gentle support without irritation"}]',
null,8,false,false,null,1,false)

ON CONFLICT (formula_code) DO NOTHING;
