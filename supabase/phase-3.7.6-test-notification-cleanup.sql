-- Phase 3.7.6 TEST DATA CLEANUP
-- Safe targeted cleanup: marks only the explicitly identified residual test notifications acknowledged.
-- It does NOT delete definitions, crawler rewards, or unrelated System Events.

update public.system_events
set status = 'acknowledged'
where
      (recipient_id = 'marvin'
       and event_type = 'loot_box_received'
       and lower(name) = lower('Bronze Fuck You Box'))
   or (recipient_id = 'harold'
       and event_type = 'achievement_received'
       and lower(name) in (lower('Test Achievement'), lower('Silver Test Achievement')));

-- Include likely historical event-type aliases without touching unrelated names.
update public.system_events
set status = 'acknowledged'
where
      (recipient_id = 'marvin'
       and lower(name) = lower('Bronze Fuck You Box')
       and lower(event_type) like '%loot%')
   or (recipient_id = 'harold'
       and lower(name) in (lower('Test Achievement'), lower('Silver Test Achievement'))
       and lower(event_type) like '%achievement%');

-- Verification
select id, name, event_type, recipient_id, status, created_at
from public.system_events
where (recipient_id = 'marvin' and lower(name) = lower('Bronze Fuck You Box'))
   or (recipient_id = 'harold' and lower(name) in (lower('Test Achievement'), lower('Silver Test Achievement')))
order by created_at desc;
