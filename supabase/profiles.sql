-- Run this in the Supabase SQL Editor. Safe to run more than once.

-- 1. Profiles: one row per user. Names are nullable so new users can be prompted for them.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  avatar_path text, -- path of the photo in the "avatars" Storage bucket, never the image itself
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row level security: each signed-in user can only see and change their own profile.
alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 2. Trigger: create an empty profile row the first time someone signs in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for anyone who signed in before this script ran.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- 3. Storage: public "avatars" bucket for profile photos (images only, max 5 MB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Signed-in users can only manage files inside their own "<user id>/" folder.
drop policy if exists "Users can view their own avatars" on storage.objects;
create policy "Users can view their own avatars"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can upload their own avatars" on storage.objects;
create policy "Users can upload their own avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can delete their own avatars" on storage.objects;
create policy "Users can delete their own avatars"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
