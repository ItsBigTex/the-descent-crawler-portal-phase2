-- THE DESCENT - Phase 2 Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null check (role in ('gm','crawler')),
  crawler_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.crawlers (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_feed (
  id bigint generated always as identity primary key,
  crawler_id text references public.crawlers(id) on delete set null,
  text text not null,
  visibility text not null default 'party' check (visibility in ('party','gm','private')),
  created_at timestamptz not null default now()
);

create table if not exists public.private_messages (
  id bigint generated always as identity primary key,
  crawler_id text not null references public.crawlers(id) on delete cascade,
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.crawlers enable row level security;
alter table public.activity_feed enable row level security;
alter table public.private_messages enable row level security;

create or replace function public.is_gm()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='gm') $$;

create or replace function public.my_crawler_id()
returns text language sql stable security definer set search_path=public
as $$ select crawler_id from public.profiles where id=auth.uid() $$;

create policy "profile self read" on public.profiles for select to authenticated using (id=auth.uid() or public.is_gm());
create policy "gm manages profiles" on public.profiles for all to authenticated using (public.is_gm()) with check (public.is_gm());

create policy "crawler read own or gm" on public.crawlers for select to authenticated using (id=public.my_crawler_id() or public.is_gm());
create policy "crawler update own or gm" on public.crawlers for update to authenticated using (id=public.my_crawler_id() or public.is_gm()) with check (id=public.my_crawler_id() or public.is_gm());
create policy "gm inserts crawlers" on public.crawlers for insert to authenticated with check (public.is_gm());
create policy "gm deletes crawlers" on public.crawlers for delete to authenticated using (public.is_gm());

create policy "party feed read" on public.activity_feed for select to authenticated
using (visibility='party' or public.is_gm() or (visibility='private' and crawler_id=public.my_crawler_id()));
create policy "feed insert own or gm" on public.activity_feed for insert to authenticated
with check (public.is_gm() or crawler_id=public.my_crawler_id());

create policy "private messages read own or gm" on public.private_messages for select to authenticated
using (crawler_id=public.my_crawler_id() or public.is_gm());
create policy "gm sends private messages" on public.private_messages for insert to authenticated
with check (public.is_gm());
create policy "crawler acknowledges own messages" on public.private_messages for update to authenticated
using (crawler_id=public.my_crawler_id() or public.is_gm())
with check (crawler_id=public.my_crawler_id() or public.is_gm());

alter publication supabase_realtime add table public.crawlers;
alter publication supabase_realtime add table public.activity_feed;
alter publication supabase_realtime add table public.private_messages;
