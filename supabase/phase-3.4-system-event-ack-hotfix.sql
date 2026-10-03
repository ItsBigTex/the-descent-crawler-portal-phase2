-- THE DESCENT — Phase 3.4 System Event acknowledgement policy
-- Run after the Phase 3.3 Content Engine migration.
-- GM retains full access; a crawler may acknowledge only events addressed to its crawler_id.

drop policy if exists system_events_recipient_ack on public.system_events;
create policy system_events_recipient_ack on public.system_events
for update to authenticated
using (
  public.is_gm()
  or recipient_id = (select p.crawler_id::text from public.profiles p where p.id = auth.uid())
)
with check (
  public.is_gm()
  or recipient_id = (select p.crawler_id::text from public.profiles p where p.id = auth.uid())
);

-- Ensure realtime is available even if the publication step was skipped previously.
do $$ begin
 begin alter publication supabase_realtime add table public.system_events;
 exception when duplicate_object then null; end;
end $$;
