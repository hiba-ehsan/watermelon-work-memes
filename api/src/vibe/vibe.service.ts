import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class VibeService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private readonly memes = [
    { id: 1, src: 'meme1.jpg', alt: 'Vibe 1' },
    { id: 2, src: 'meme2.jpg', alt: 'Vibe 2' },
    { id: 3, src: 'meme3.jpg', alt: 'Vibe 3' },
  ];

  getMemes() {
    return this.memes;
  }

  async submit(dto: { title: string; image_url: string }, userId: string) {
    const admin = this.supabaseService.adminClient;

    const { data, error } = await admin
      .from('vibes')
      .insert({
        title: dto.title,
        image_url: dto.image_url,
        is_approved: false,
        submitted_by: userId,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { vibeId: data.id, imageUrl: dto.image_url };
  }

  async select(vibeId: string, userId: string) {
    const admin = this.supabaseService.adminClient;
    const today = new Date().toISOString().split('T')[0];

    const { error: insertError } = await admin
      .from('vibe_selections')
      .insert({ user_id: userId, vibe_id: vibeId, selected_date: today });

    if (insertError) {
      if (insertError.code === '23505') {
        return { error: 'Already picked today', status: 409 };
      }
      throw new Error(insertError.message);
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('current_streak, last_vibe_date')
      .eq('id', userId)
      .single();

    let newStreak = 1;
    if (profile?.last_vibe_date) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      newStreak =
        profile.last_vibe_date === yesterdayStr
          ? (profile.current_streak || 0) + 1
          : 1;
    }

    await admin
      .from('profiles')
      .update({ current_streak: newStreak, last_vibe_date: today })
      .eq('id', userId);

    const { count } = await admin
      .from('vibe_selections')
      .select('*', { count: 'exact', head: true })
      .eq('vibe_id', vibeId)
      .eq('selected_date', today);

    const matchCount = count || 1;

    return { matchCount, newStreak, isTwinMatch: matchCount > 1 };
  }
}
