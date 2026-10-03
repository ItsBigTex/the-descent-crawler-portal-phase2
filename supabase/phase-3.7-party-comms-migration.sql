-- THE DESCENT // PHASE 3.7 PARTY COMMUNICATIONS
create table if not exists public.party_messages (
  id bigint generated always as identity primary key,
  sender_crawler_id text not null references public.crawlers(id) on delete cascade,
  sender_name text,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.party_messages enable row level security;

drop policy if exists "party messages read authenticated" on public.party_messages;
create policy "party messages read authenticated" on public.party_messages
for select to authenticated using (true);

drop policy if exists "crawler sends own party messages" on public.party_messages;
create policy "crawler sends own party messages" on public.party_messages
for insert to authenticated
with check (sender_crawler_id=public.my_crawler_id() or public.is_gm());

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='party_messages'
  ) then
    alter publication supabase_realtime add table public.party_messages;
  end if;
end $$;
