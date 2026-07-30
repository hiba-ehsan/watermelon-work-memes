import { NextResponse } from 'next/server';
import { fromServer } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('vibe-submissions')
    .upload(fileName, image, { contentType: image.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('vibe-submissions')
    .getPublicUrl(fileName);

  const admin = createAdminClient();
  const { data: vibe, error: dbError } = await admin
    .from('vibes')
    .insert({
      title,
      image_url: publicUrl,
      is_approved: false,
      submitted_by: user.id,
    })
    .select('id')
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ vibeId: vibe.id, imageUrl: publicUrl });
}
