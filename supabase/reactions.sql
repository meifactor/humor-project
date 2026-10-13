-- Reactions (💀 dead, 😂 funny, 😬 cringe, 🤨 huh) replace upvotes/downvotes, and
-- generations get a caption "vibe". Run after captions.sql. Safe to run more than once.
begin;

-- Drop things that depend on the columns being changed; they're recreated below.
drop trigger if exists on_caption_vote_change on public.caption_votes;
drop view if exists public.creator_leaderboard;

-- 1. caption_votes: one reaction per user per caption instead of +1/-1.
alter table public.caption_votes add column if not exists reaction text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'caption_votes' and column_name = 'value'
  ) then
    -- Existing upvotes become 😂 funny, downvotes become 🤨 huh.
    update public.caption_votes
      set reaction = case when value = 1 then 'funny' else 'huh' end
      where reaction is null;
    alter table public.caption_votes drop column value;
  end if;
end;
$$;

alter table public.caption_votes alter column reaction set not null;
alter table public.caption_votes drop constraint if exists caption_votes_reaction_check;
alter table public.caption_votes
  add constraint caption_votes_reaction_check
  check (reaction in ('dead', 'funny', 'cringe', 'huh'));

-- 2. captions: a count per reaction, and a score of 💀×2 + 😂×1 + 😬×0 − 🤨×1.
alter table public.captions drop column if exists score;
alter table public.captions drop column if exists upvotes;
alter table public.captions drop column if exists downvotes;

alter table public.captions
  add column if not exists dead_count integer not null default 0,
  add column if not exists funny_count integer not null default 0,
  add column if not exists cringe_count integer not null default 0,
  add column if not exists huh_count integer not null default 0;

update public.captions c set
  dead_count = (select count(*) from public.caption_votes v where v.caption_id = c.id and v.reaction = 'dead'),
  funny_count = (select count(*) from public.caption_votes v where v.caption_id = c.id and v.reaction = 'funny'),
  cringe_count = (select count(*) from public.caption_votes v where v.caption_id = c.id and v.reaction = 'cringe'),
  huh_count = (select count(*) from public.caption_votes v where v.caption_id = c.id and v.reaction = 'huh');

alter table public.captions
  add column score integer generated always as (2 * dead_count + funny_count - huh_count) stored;

create index if not exists captions_score_idx on public.captions (score desc, created_at desc);

-- Keep the counts in sync whenever someone reacts, changes or removes a reaction.
create or replace function public.update_caption_vote_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.captions
      set dead_count = dead_count - (old.reaction = 'dead')::int,
          funny_count = funny_count - (old.reaction = 'funny')::int,
          cringe_count = cringe_count - (old.reaction = 'cringe')::int,
          huh_count = huh_count - (old.reaction = 'huh')::int
      where id = old.caption_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.captions
      set dead_count = dead_count + (new.reaction = 'dead')::int,
          funny_count = funny_count + (new.reaction = 'funny')::int,
          cringe_count = cringe_count + (new.reaction = 'cringe')::int,
          huh_count = huh_count + (new.reaction = 'huh')::int
      where id = new.caption_id;
  end if;

  return null;
end;
$$;

create trigger on_caption_vote_change
  after insert or update or delete on public.caption_votes
  for each row execute function public.update_caption_vote_counts();

-- 3. generations: the humor style the AI was asked to write in.
alter table public.generations add column if not exists vibe text not null default 'genz';
alter table public.generations drop constraint if exists generations_vibe_check;
alter table public.generations
  add constraint generations_vibe_check
  check (vibe in ('genz', 'dad', 'newyorker', 'core'));

-- 4. Recreate the creator leaderboard on the new score.
create view public.creator_leaderboard
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

commit;
