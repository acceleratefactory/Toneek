import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendCheckinReminder } from '@/lib/email/sendCheckinReminder'

export async function GET(request: Request) {
  // Verify Vercel Cron Secret
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const { data: subscriptions, error } = await adminClient
      .from('subscriptions')
      .select('user_id, treatment_start_date')
      .eq('status', 'active')
      .not('treatment_start_date', 'is', null);

    if (error || !subscriptions) throw error;

    const today = new Date();
    today.setUTCHours(0,0,0,0);

    const msPerDay = 1000 * 60 * 60 * 24;
    let reminderCount = 0;

    for (const sub of subscriptions) {
      const start = new Date(sub.treatment_start_date);
      start.setUTCHours(0,0,0,0);
      const daysSince = Math.floor((today.getTime() - start.getTime()) / msPerDay);

      // Weeks 2 (Day 14), 4 (Day 28), 8 (Day 56)
      let dueWeek = 0;
      if (daysSince === 14) dueWeek = 2;
      else if (daysSince === 28) dueWeek = 4;
      else if (daysSince === 56) dueWeek = 8;

      if (dueWeek > 0) {
        // Fetch user info
        const { data: profile } = await adminClient.from('profiles').select('email, full_name').eq('id', sub.user_id).single();
        
        // Ensure they haven't ALREADY checked in for this week
        const { count: existingCheckin } = await adminClient
          .from('skin_outcomes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', sub.user_id)
          .eq('check_in_week', dueWeek);

        if (profile?.email && (existingCheckin === 0)) {
          await sendCheckinReminder({
            email: profile.email,
            customerName: profile.full_name?.split(' ')[0] || 'there',
            week: dueWeek,
            baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://toneek.com'
          });
          reminderCount++;
        }
      }
    }

    return NextResponse.json({ success: true, count: reminderCount });
  } catch (err) {
    console.error('Checkin reminder cron error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
