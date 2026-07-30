import { NextResponse } from 'next/server';
import { fromServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await fromServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { vibeId } = await request.json();

  if (!vibeId) {
    return NextResponse.json({ error: 'vibeId is required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { error: insertError } = await supabase
    .from('vibe_selections')
    .insert({ user_id: user.id, vibe_id: vibeId, selected_date: today });

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Already picked today' }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, last_vibe_date')
    .eq('id', user.id)
    .single();

  let newStreak = 1;
  if (profile?.last_vibe_date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    newStreak = profile.last_vibe_date === yesterdayStr
      ? (profile.current_streak || 0) + 1
      : 1;
  }

  await supabase
    .from('profiles')
    .update({ current_streak: newStreak, last_vibe_date: today })
    .eq('id', user.id);

  const { count } = await supabase
    .from('vibe_selections')
    .select('*', { count: 'exact', head: true })
    .eq('vibe_id', vibeId)
    .eq('selected_date', today);

  const matchCount = count || 1;

  return NextResponse.json({ matchCount, newStreak, isTwinMatch: matchCount > 1 });
}
