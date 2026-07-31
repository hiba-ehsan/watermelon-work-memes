import { NextResponse } from 'next/server';
import { fromServer } from '@/lib/supabase/server';
import { apiClient } from '@/lib/api-client';

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

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  try {
    const result = await apiClient<{
      matchCount: number;
      newStreak: number;
      isTwinMatch: boolean;
    }>({
      path: '/vibe/select',
      method: 'POST',
      body: { vibe_id: vibeId },
      accessToken,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err.status || 500;
    const message = err.message || 'Failed to select vibe';
    return NextResponse.json({ error: message }, { status });
  }
}
