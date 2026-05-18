-- Add upgrade tracking to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS previous_plan_tier TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS upgrade_order_id UUID REFERENCES orders(id) DEFAULT NULL;

-- Add order_type option for upgrades (already has 'new' and 'renewal')
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders 
  ADD CONSTRAINT orders_order_type_check 
  CHECK (order_type IN ('new', 'renewal', 'upgrade'));
