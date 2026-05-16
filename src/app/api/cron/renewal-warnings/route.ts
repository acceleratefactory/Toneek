import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendRenewalWarning } from '@/lib/email/sendRenewalWarning'

export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const { data: subscriptions, error } = await adminClient
      .from('subscriptions')
      .select('user_id, next_billing_date, plan_tier')
      .eq('status', 'active')
      .not('next_billing_date', 'is', null);

    if (error || !subscriptions) throw error;

    const today = new Date();
    today.setUTCHours(0,0,0,0);
    const msPerDay = 1000 * 60 * 60 * 24;
    let warningCount = 0;

    for (const sub of subscriptions) {
      const nextBilling = new Date(sub.next_billing_date);
      nextBilling.setUTCHours(0,0,0,0);
      
      const daysUntilBilling = Math.round((nextBilling.getTime() - today.getTime()) / msPerDay);

      // Exactly 3 days away
      if (daysUntilBilling === 3) {
        // Fetch user info
        const { data: profile } = await adminClient.from('profiles').select('email, full_name, currency').eq('id', sub.user_id).single();
        
        // Fetch pricing to get amount
        const { data: tier } = await adminClient.from('subscription_tiers').select('prices').eq('id', sub.plan_tier).single();
        
        if (profile?.email && tier?.prices) {
          const userCurrency = profile.currency || 'USD';
          const priceData = tier.prices[userCurrency] || tier.prices['USD'];
          const amount = priceData?.amount || 45;

          await sendRenewalWarning({
            email: profile.email,
            customerName: profile.full_name?.split(' ')[0] || 'there',
            renewalDate: nextBilling.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            amount,
            currency: userCurrency,
            baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://toneek.com'
          });
          warningCount++;
        }
      }
    }

    return NextResponse.json({ success: true, count: warningCount });
  } catch (err) {
    console.error('Renewal warning cron error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
