-- Run this in the Supabase SQL Editor to create and seed the jokes table.
create table if not exists public.jokes (
  id bigint generated always as identity primary key,
  setup text not null,
  punchline text not null,
  created_at timestamptz not null default now()
);

alter table public.jokes enable row level security;

-- Anyone (including the anon key) may read jokes; nobody may write without a policy.
drop policy if exists "Jokes are publicly readable" on public.jokes;
create policy "Jokes are publicly readable"
  on public.jokes for select
  to anon, authenticated
  using (true);

insert into public.jokes (setup, punchline) values
  ('Why don''t scientists trust atoms?', 'Because they make up everything.'),
  ('Why did the scarecrow win an award?', 'He was outstanding in his field.'),
  ('What do you call fake spaghetti?', 'An impasta.'),
  ('Why did the developer go broke?', 'Because they used up all their cache.'),
  ('How do you comfort a JavaScript bug?', 'You console it.');
