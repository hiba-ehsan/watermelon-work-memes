import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.ADMIN_SECRET}`;

  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { vibeId, action } = await request.json();

  if (!vibeId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'vibeId and action (approve|reject) required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (action === 'reject') {
    const { error } = await supabase.from('vibes').delete().eq('id', vibeId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: 'rejected' });
  }

  const { error } = await supabase
    .from('vibes')
    .update({ is_approved: true })
    .eq('id', vibeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ status: 'approved' });
}
