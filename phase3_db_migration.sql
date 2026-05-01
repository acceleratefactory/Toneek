-- Add routine_tier to orders table so production queue knows what to pick
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS routine_tier TEXT 
    CHECK (routine_tier IN ('just_one', 'two_to_three', 'whatever_it_takes'))
    DEFAULT 'just_one';

-- Add fourth_product to orders for whatever_it_takes customers
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fourth_product TEXT DEFAULT NULL;
  -- Expected Values: 'toneek_mineral_spf_50' | 'toneek_brightening_toner' | 'toneek_hydrating_toner'

-- Inventory table for companion products
CREATE TABLE IF NOT EXISTS companion_product_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_sku TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  units_in_stock INTEGER DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 20,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial SKUs
INSERT INTO companion_product_inventory (product_sku, product_name, units_in_stock) VALUES
  ('TNK-CLN-100', 'Toneek Barrier Cleanser 100ml', 0),
  ('TNK-MST-50', 'Toneek Lightweight Moisturiser 50ml', 0),
  ('TNK-SPF-30', 'Toneek Mineral SPF 50 30ml', 0),
  ('TNK-TON-BRT', 'Toneek Brightening Toner 30ml', 0),
  ('TNK-TON-HYD', 'Toneek Hydrating Toner 30ml', 0)
ON CONFLICT (product_sku) DO NOTHING;
