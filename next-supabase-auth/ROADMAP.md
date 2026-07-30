# Implementation Roadmap: Vibe Meme Engine

## Phase 0: Foundations (Server Client + Types)

### Step 0.1 — Supabase Database Types
**File: `lib/supabase/types.ts`**
- Define TypeScript interfaces matching the SQL schema:
```ts
export interface Profile {
  id: string;          // references auth.users
  username: string | null;
  current_streak: number;
  last_vibe_date: string | null;  // ISO date
  created_at: string;
}

export interface Vibe {
  id: string;
  title: string;
  image_url: string;
  is_active_today: boolean;
  is_approved: boolean;
  submitted_by: string | null;  // user id
  vibe_date: string | null;     // ISO date
  created_at: string;
}

export interface VibeSelection {
  id: string;
  user_id: string;
  vibe_id: string;
  selected_date: string;  // current_date
  created_at: string;
}
```

### Step 0.2 — Supabase Server Client
**File: `lib/supabase/server.ts`**
- Create a `createServerClient()` using `@supabase/ssr`'s `createServerClient` (like `auth/callback/route.ts` but as a reusable utility).
- Uses `cookies()` from `next/headers`.

### Step 0.3 — Supabase Admin Client
**File: `lib/supabase/admin.ts`**
- Create a `createAdminClient()` using `createClient` from `@supabase/supabase-js` (NOT ssr).
- Uses `SERVICE_ROLE_KEY` env var for bypassing RLS (used in cron jobs and moderation).

---

## Phase 1: Vibe Selection API + Streaks

### Step 1.1 — SQL Migrations (Run in Supabase SQL Editor)
```sql
-- profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  current_streak integer default 0,
  last_vibe_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- auto-create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'user_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- vibes table
create table public.vibes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text not null,
  is_active_today boolean default false,
  is_approved boolean default true,
  submitted_by uuid references auth.users(id),
  vibe_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- vibe_selections table
create table public.vibe_selections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  vibe_id uuid references public.vibes(id) on delete cascade not null,
  selected_date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, selected_date)  -- one pick per day
);

-- Enable Realtime
alter publication supabase_realtime add table public.vibe_selections;

-- Indexes
create index idx_vibe_selections_vibe_date on public.vibe_selections(vibe_id, selected_date);
create index idx_vibes_active_date on public.vibes(is_active_today, vibe_date);
```

### Step 1.2 — API Route: POST /api/vibe/select
**File: `app/api/vibe/select/route.ts`**
- Reads `{ vibeId }` from request body.
- Gets authenticated user from `createServerClient()`.
- Inserts into `vibe_selections` (fails if user already picked today — returns 409).
- Updates `profiles` streak:
  - If `last_vibe_date == yesterday`: `current_streak += 1`
  - If `last_vibe_date < yesterday` or null: `current_streak = 1`
  - Set `last_vibe_date = current_date`
- Queries count of users who picked same `vibeId` today.
- Returns `{ matchCount, newStreak, isTwinMatch: matchCount > 1 }`.

### Step 1.3 — Update Vibes Page to Call API
**File: `app/vibes/page.tsx`**
- Fetch live vibes from Supabase: `vibes` table where `is_active_today == true`.
- On card click: call `/api/vibe/select`, handle response.
- If `isTwinMatch`: trigger confetti + banner.
- Show streak counter from profile.
- Play sound on selection using `useSystemSound` hook.

---

## Phase 2: Sound System Hook

### Step 2.1 — Create useSystemSound Hook
**File: `hooks/useSystemSound.ts`**
- Map `SoundEvent` types to audio file paths.
- Export `playSound(event)` function.
- Sound files to add in `public/sounds/`:
  - `blip.mp3` (hover/click)
  - `fahhh.mp3` (already exists)
  - `boot.mp3` (signup)
  - `twin-match.mp3` (twin match)
  - `glitch-error.mp3` (error)

---

## Phase 3: Daily Vibe Rotation Cron

### Step 3.1 — API Route: GET /api/cron/rotate-vibes
**File: `app/api/cron/rotate-vibes/route.ts`**
- Authenticate via `CRON_SECRET` header (env var).
- Uses admin client (service_role) to:
  1. Set `is_active_today = false` on all vibes.
  2. Select 3 random approved vibes (`is_approved = true`).
  3. Set `is_active_today = true` and `vibe_date = current_date`.
- Returns `{ rotated: 3 }`.

### Step 3.2 — Vercel Cron Config
**File: `vercel.json`** (create if not exists)
```json
{
  "crons": [
    {
      "path": "/api/cron/rotate-vibes",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## Phase 4: Same Twin Realtime

### Step 4.1 — Realtime Subscription in Vibes Page
**File: `app/vibes/page.tsx`** (augment)
- Subscribe to `vibe_selections` channel via Supabase Realtime.
- Filter for same `vibe_id` as user's pick + today's `selected_date`.
- Update `matchCount` live as new users pick the same vibe.
- Show "You and X others are Twins today!" banner.

---

## Phase 5: UGC Meme Submission + Moderation

### Step 5.1 — Supabase Storage Bucket
Create `vibe-submissions` bucket (public read, authenticated write).

### Step 5.2 — Upload API Route: POST /api/vibe/submit
**File: `app/api/vibe/submit/route.ts`**
- Accepts `FormData` with `title` + `image` file.
- Uploads image to `vibe-submissions` bucket.
- Inserts into `vibes` with `is_approved = false`.
- Triggers webhook to n8n for moderation notification.
- Returns `{ vibeId, imageUrl }`.

### Step 5.3 — Moderation API Route: POST /api/vibe/moderate
**File: `app/api/vibe/moderate/route.ts`**
- Accepts `{ vibeId, action: 'approve' | 'reject' }`.
- Admin-protected (checks admin secret header).
- Sets `is_approved = true` or deletes the row.

### Step 5.4 — Upload UI
**File: `app/upload/page.tsx`** (new)
- File input + title field.
- Calls `/api/vibe/submit`.
- Shows pending message ("Submitted for moderation").

---

## Phase 6: n8n Webhook Integrations

### Step 6.1 — Selection Webhook
On every vibe selection, fire a background webhook to n8n:
- Payload: `{ userId, vibeTitle, timestamp }`
- n8n workflow: posts to Discord/Slack channel.

### Step 6.2 — Daily Digest Webhook
After cron rotation, fire webhook to n8n:
- Payload: `{ date, vibes: [{ title, image_url }] }`
- n8n workflow: posts tweet/story with today's vibes.

### Step 6.3 — Welcome Email Webhook
On new user signup (triggered by DB webhook or auth hook):
- n8n workflow: sends terminal-boot-log styled welcome email.

---

## File Creation Order (for your AI assistant)

```
 1. lib/supabase/types.ts           — database type definitions
 2. lib/supabase/server.ts           — server client utility
 3. lib/supabase/admin.ts            — admin client (service_role)
 4. hooks/useSystemSound.ts          — sound event system
 5. app/api/vibe/select/route.ts     — selection + streak API
 6. app/vibes/page.tsx (modify)      — wire up live data + API
 7. app/api/cron/rotate-vibes/route.ts  — daily rotation cron
 8. vercel.json                      — cron schedule config
 9. app/api/vibe/submit/route.ts     — UGC upload API
10. app/api/vibe/moderate/route.ts   — moderation API
11. app/upload/page.tsx              — upload UI
```

## Prompt Template for Each File

> "Create file `lib/supabase/types.ts` with TypeScript interfaces for Profile, Vibe, and VibeSelection matching the Supabase SQL schema defined in ROADMAP.md. Each interface should use `string` for UUIDs and dates, `number` for integers, and `boolean` for flags. No comments, no exports beyond the three interfaces."
