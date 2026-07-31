import { NextResponse } from 'next/server';
import { fromServer } from '@/lib/supabase/server';
import { apiClient } from '@/lib/api-client';

export async function POST(request: Request) {
  const supabase = await fromServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get('title') as string;
  const image = formData.get('image') as File;

  if (!title || !image) {
    return NextResponse.json({ error: 'title and image are required' }, { status: 400 });
  }

  const ext = image.name.split('.').pop() || 'png';
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('vibe-submissions')
    .upload(fileName, image, { contentType: image.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('vibe-submissions')
    .getPublicUrl(fileName);

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  try {
    const result = await apiClient<{ vibeId: string; imageUrl: string }>({
      path: '/vibe/submit',
      method: 'POST',
      body: { title, image_url: publicUrl },
      accessToken,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to submit vibe' },
      { status: err.status || 500 },
    );
  }
}
