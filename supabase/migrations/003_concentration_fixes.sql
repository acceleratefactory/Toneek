-- ============================================================
-- Sprint 1 Task 2 — Chemist Final Position Concentration Fixes
-- Run in Supabase SQL Editor AFTER 002_seed.sql
-- ============================================================
-- Change 1: Salicylic Acid 2% → 1.5% on all 5 SA-containing formulas
-- Change 2: Azelaic Acid 10% → 8% on LG-OA-01 ONLY
-- ============================================================

-- LG-OA-01 (Humid Tropical / Oily / Acne)
-- SA: 2% → 1.5% | AzA: 10% → 8%
UPDATE formula_codes
SET active_modules = '[
  {"name": "Niacinamide", "concentration": 10, "unit": "%", "rationale": "Regulates sebum and blocks melanin transfer from new breakouts"},
  {"name": "Salicylic Acid", "concentration": 1.5, "unit": "%", "rationale": "Oil-soluble — penetrates follicle walls where blackheads form"},
  {"name": "Azelaic Acid", "concentration": 8, "unit": "%", "rationale": "Dual action: anti-acne and tyrosinase inhibitor for PIH"}
]'::jsonb
WHERE formula_code = 'LG-OA-01';

-- AB-OA-01 (Semi-Arid / Oily / Acne)
-- SA: 2% → 1.5% | AzA stays at 10%
UPDATE formula_codes
SET active_modules = '[
  {"name": "Niacinamide", "concentration": 10, "unit": "%", "rationale": "Sebum regulation and PIH prevention"},
  {"name": "Salicylic Acid", "concentration": 1.5, "unit": "%", "rationale": "Oil-soluble acne treatment"},
  {"name": "Azelaic Acid", "concentration": 10, "unit": "%", "rationale": "Anti-acne and anti-inflammatory"}
]'::jsonb
WHERE formula_code = 'AB-OA-01';

-- LG-OH-01 (Humid Tropical / Oily / Oiliness)
-- SA: 2% → 1.5%
UPDATE formula_codes
SET active_modules = '[
  {"name": "Niacinamide", "concentration": 10, "unit": "%", "rationale": "Sebum regulation"},
  {"name": "Salicylic Acid", "concentration": 1.5, "unit": "%", "rationale": "Pore clearing and sebum control"}
]'::jsonb
WHERE formula_code = 'LG-OH-01';

-- GN-OT-01 (General / Oily / Texture)
-- SA already 1.5% in seed — confirming correct value
UPDATE formula_codes
SET active_modules = '[
  {"name": "Niacinamide", "concentration": 10, "unit": "%", "rationale": "Pore refinement and sebum control"},
  {"name": "Salicylic Acid", "concentration": 1.5, "unit": "%", "rationale": "Texture improvement"},
  {"name": "Azelaic Acid", "concentration": 10, "unit": "%", "rationale": "Skin refinement"}
]'::jsonb
WHERE formula_code = 'GN-OT-01';

-- M-OA-01 (Male / Oily / Razor Bumps)
-- SA: 2% → 1.5% | AzA stays at 15%
UPDATE formula_codes
SET active_modules = '[
  {"name": "Niacinamide", "concentration": 10, "unit": "%", "rationale": "Reduces razor bump hyperpigmentation"},
  {"name": "Azelaic Acid", "concentration": 15, "unit": "%", "rationale": "Anti-inflammatory for pseudofolliculitis barbae"},
  {"name": "Salicylic Acid", "concentration": 1.5, "unit": "%", "rationale": "Prevents ingrown hairs"}
]'::jsonb
WHERE formula_code = 'M-OA-01';

-- ============================================================
-- Verify the updates were applied correctly
-- ============================================================
SELECT
  formula_code,
  active_modules
FROM formula_codes
WHERE formula_code IN ('LG-OA-01', 'AB-OA-01', 'LG-OH-01', 'GN-OT-01', 'M-OA-01')
ORDER BY formula_code;
