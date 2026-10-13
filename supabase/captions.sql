-- Assignment 4: AI photo captions, voting, and row level security on every table.
-- Run this in the Supabase SQL Editor after profiles.sql. Safe to run more than once.

-- 1. Generations: one uploaded photo plus the prompt that was sent to the AI.
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_path text not null, -- path in the "uploads" Storage bucket, never the image itself
  context text check (char_length(context) <= 200), -- optional note from the uploader
  prompt text not null, -- the full prompt sent to Gemini
  model text not null,
  created_at timestamptz not null default now()
);

create index if not exists generations_created_at_idx on public.generations (created_at desc);
create index if not exists generations_user_id_idx on public.generations (user_id, created_at desc);

-- 2. Captions written by the AI for a generation. Vote totals are kept up to date by a trigger.
create table if not exists public.captions (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  position smallint not null,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  score integer generated always as (upvotes - downvotes) stored,
  created_at timestamptz not null default now(),
  unique (generation_id, position)
);

create index if not exists captions_generation_id_idx on public.captions (generation_id);
create index if not exists captions_score_idx on public.captions (score desc, created_at desc);

-- 3. Votes: one row per user per caption (+1 or -1). Changing a vote updates the row.
create table if not exists public.caption_votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  caption_id uuid not null references public.captions (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, caption_id)
);

create index if not exists caption_votes_caption_id_idx on public.caption_votes (caption_id);

-- Keep captions.upvotes / downvotes in sync, so totals are public without revealing who voted.
create or replace function public.update_caption_vote_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.captions
      set upvotes = upvotes - (old.value = 1)::int,
          downvotes = downvotes - (old.value = -1)::int
      where id = old.caption_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.captions
      set upvotes = upvotes + (new.value = 1)::int,
          downvotes = downvotes + (new.value = -1)::int
      where id = new.caption_id;
  end if;

  return null;
end;
$$;

drop trigger if exists on_caption_vote_change on public.caption_votes;
create trigger on_caption_vote_change
  after insert or update or delete on public.caption_votes
  for each row execute function public.update_caption_vote_counts();

-- 4. Leaderboard of creators. security_invoker makes it respect the RLS of the tables it reads.
create or replace view public.creator_leaderboard
with (security_invoker = on) as
select
  p.id as user_id,
  p.first_name,
  p.last_name,
  p.avatar_path,
  count(distinct g.id) as generation_count,
  coalesce(sum(c.score), 0) as total_score
from public.profiles p
join public.generations g on g.user_id = p.id
left join public.captions c on c.generation_id = g.id
group by p.id;

-- 5. Row level security on every table, as strict as the app allows.

-- jokes (Assignment 2): anyone can read, nobody can write.
alter table public.jokes enable row level security;

-- profiles: names and photos appear next to public captions, so everyone may read them.
-- Only the owner can create or change their row (policies from profiles.sql).
alter table public.profiles enable row level security;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- generations: anyone can read; only the owner can delete. There is deliberately no insert
-- policy: the server inserts generations with the service role after calling the AI.
alter table public.generations enable row level security;
drop policy if exists "Generations are publicly readable" on public.generations;
create policy "Generations are publicly readable"
  on public.generations for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can delete their own generations" on public.generations;
create policy "Users can delete their own generations"
  on public.generations for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- captions: anyone can read; users can't write them at all (only the server can).
alter table public.captions enable row level security;
drop policy if exists "Captions are publicly readable" on public.captions;
create policy "Captions are publicly readable"
  on public.captions for select
  to anon, authenticated
  using (true);

-- caption_votes: signed-in users can only see and change their own votes.
alter table public.caption_votes enable row level security;

drop policy if exists "Users can view their own votes" on public.caption_votes;
create policy "Users can view their own votes"
  on public.caption_votes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can vote" on public.caption_votes;
create policy "Users can vote"
  on public.caption_votes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can change their own votes" on public.caption_votes;
create policy "Users can change their own votes"
  on public.caption_votes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their own votes" on public.caption_votes;
create policy "Users can remove their own votes"
  on public.caption_votes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 6. Storage: public "uploads" bucket for photos to caption (images only, max 10 MB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Signed-in users can only manage files inside their own "<user id>/" folder.
drop policy if exists "Users can view their own uploads" on storage.objects;
create policy "Users can view their own uploads"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can add their own uploads" on storage.objects;
create policy "Users can add their own uploads"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can delete their own uploads" on storage.objects;
create policy "Users can delete their own uploads"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);
