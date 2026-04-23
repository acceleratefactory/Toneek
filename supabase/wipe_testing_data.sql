-- ==============================================================================
-- WIPE TESTING DATA SCRIPT (UPDATED)
-- ==============================================================================
-- WARNING: This script permanently deletes all user accounts, orders, assessments,
-- subscriptions, and system queues, EXCEPT for the specified admin account. 
-- It deliberately spares system configurations, formulas, and city climates.

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- 1. Securely locate the master admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'smartshorppa@gmail.com' 
    LIMIT 1;

    -- Safety fallback to prevent destroying the entire database if the email mismatches
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin account smartshorppa@gmail.com not found. Aborting system wipe to prevent lock-out.';
    END IF;

    -- 2. Clear self-referential foreign keys to prevent locking during mass purge
    UPDATE public.profiles SET referred_by = NULL;

    -- 3. Delete from standalone child tables before user deletion
    -- We use "IS DISTINCT FROM" to ensure we also delete rows where user_id is NULL
    -- (which is why some of your test orders were left behind!)
    
    DELETE FROM public.product_verifications 
    WHERE order_id IN (SELECT id FROM public.orders WHERE user_id IS DISTINCT FROM admin_user_id);

    DELETE FROM public.bank_transfer_sessions 
    WHERE user_id IS DISTINCT FROM admin_user_id;

    DELETE FROM public.orders 
    WHERE user_id IS DISTINCT FROM admin_user_id;

    DELETE FROM public.prediction_log 
    WHERE user_id IS DISTINCT FROM admin_user_id;

    DELETE FROM public.reformulations 
    WHERE user_id IS DISTINCT FROM admin_user_id;
    
    -- Clear out any potential orphaned rows just in case:
    DELETE FROM public.skin_assessments
    WHERE user_id IS DISTINCT FROM admin_user_id;

    DELETE FROM public.subscriptions
    WHERE user_id IS DISTINCT FROM admin_user_id;

    -- 4. Delete independent operational queues generated during testing
    DELETE FROM public.unmatched_transactions;
    DELETE FROM public.production_queue;

    -- 5. THE GREAT PURGE: Delete all other users from the protected auth schema.
    DELETE FROM auth.users 
    WHERE id != admin_user_id;

    -- Execution Complete. The database is now sanitized down to just the Admin.

END $$;
