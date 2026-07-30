import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  await supabase
    .from('vibes')
    .update({ is_active_today: false })
    .neq('id', '');

  const { data: vibes } = await supabase
    .from('vibes')
    .select('id')
    .eq('is_approved', true)
    .limit(3);

  if (!vibes || vibes.length === 0) {
    return NextResponse.json({ rotated: 0 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('vibes')
    .update({ is_active_today: true, vibe_date: today })
    .in('id', vibes.map(v => v.id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rotated: vibes.length });
}
