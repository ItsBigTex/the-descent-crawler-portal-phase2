-- Phase 2.3 verification/migration
-- private_messages already exists in the Phase 2 schema. This makes Realtime publication idempotent.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='private_messages'
  ) then
    alter publication supabase_realtime add table public.private_messages;
  end if;
end $$;
