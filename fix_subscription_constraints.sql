-- Drop the legacy check constraints that restrict subscription tiers to only the original 3 plans
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_tier_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
