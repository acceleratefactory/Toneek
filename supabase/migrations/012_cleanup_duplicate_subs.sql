-- 012_cleanup_duplicate_subs.sql
-- Fix stranded orders that were silently rejected
UPDATE public.orders 
SET payment_status = 'confirmed', payment_token_used = true 
WHERE payment_status = 'pending_verification' 
  AND customer_claimed_sent_at IS NOT NULL;

-- Clean up duplicate subscriptions created from the silent looping bug
-- This keeps only the initial active subscription for each user and deletes the duplicated ones
WITH ranked_subs AS (
  SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY started_at ASC) as rn
  FROM public.subscriptions
  WHERE status = 'active'
)
DELETE FROM public.subscriptions
WHERE id IN (
  SELECT id FROM ranked_subs WHERE rn > 1
);
