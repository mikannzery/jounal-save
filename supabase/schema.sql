create extension if not exists "pgcrypto";

create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  url text,
  memo text,
  ai_summary text,
  ai_summary_updated_at timestamptz,
  image_path text,
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.clips
  add column if not exists ai_summary text;

alter table if exists public.clips
  add column if not exists ai_summary_updated_at timestamptz;

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clip_tags (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade
);

create index if not exists clips_user_created_idx on public.clips (user_id, created_at desc);
create index if not exists clips_user_archived_idx on public.clips (user_id, is_archived, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_clips_updated_at on public.clips;
create trigger set_clips_updated_at
before update on public.clips
for each row
execute function public.set_updated_at();

alter table public.clips enable row level security;
alter table public.tags enable row level security;
alter table public.clip_tags enable row level security;

drop policy if exists "Users can read own clips" on public.clips;
create policy "Users can read own clips"
on public.clips
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own clips" on public.clips;
create policy "Users can insert own clips"
on public.clips
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own clips" on public.clips;
create policy "Users can update own clips"
on public.clips
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own clips" on public.clips;
create policy "Users can delete own clips"
on public.clips
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own tags" on public.tags;
create policy "Users can read own tags"
on public.tags
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own tags" on public.tags;
create policy "Users can insert own tags"
on public.tags
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own tags" on public.tags;
create policy "Users can update own tags"
on public.tags
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tags" on public.tags;
create policy "Users can delete own tags"
on public.tags
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own clip tags" on public.clip_tags;
create policy "Users can read own clip tags"
on public.clip_tags
for select
using (
  exists (
    select 1
    from public.clips
    where clips.id = clip_tags.clip_id
      and clips.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own clip tags" on public.clip_tags;
create policy "Users can insert own clip tags"
on public.clip_tags
for insert
with check (
  exists (
    select 1
    from public.clips
    where clips.id = clip_tags.clip_id
      and clips.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own clip tags" on public.clip_tags;
create policy "Users can delete own clip tags"
on public.clip_tags
for delete
using (
  exists (
    select 1
    from public.clips
    where clips.id = clip_tags.clip_id
      and clips.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('clip-images', 'clip-images', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload own clip images" on storage.objects;
create policy "Users can upload own clip images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'clip-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own clip images" on storage.objects;
create policy "Users can update own clip images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'clip-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'clip-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own clip images" on storage.objects;
create policy "Users can delete own clip images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'clip-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
