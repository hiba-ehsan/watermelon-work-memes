export interface Profile {
  id: string;
  username: string | null;
  current_streak: number;
  last_vibe_date: string | null;
  created_at: string;
}

export interface Vibe {
  id: string;
  title: string;
  image_url: string;
  is_active_today: boolean;
  is_approved: boolean;
  submitted_by: string | null;
  vibe_date: string | null;
  created_at: string;
}

export interface VibeSelection {
  id: string;
  user_id: string;
  vibe_id: string;
  selected_date: string;
  created_at: string;
}
