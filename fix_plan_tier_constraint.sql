-- Drop the legacy check constraint that restricts plan_tier to only the original 3 plans
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_plan_tier_check;
