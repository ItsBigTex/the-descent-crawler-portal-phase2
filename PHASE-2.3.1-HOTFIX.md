# Phase 2.3.1 Hotfix

This hotfix addresses two observed failures:
1. Private messages were not appearing until a page refresh.
2. ACKNOWLEDGE did not persist `read=true`.

Changes:
- Keeps Supabase Realtime subscriptions, but adds a 2-second authenticated message-sync fallback so delivery does not depend solely on the browser's Realtime channel.
- ACKNOWLEDGE now performs an UPDATE followed by `.select(...).single()` and refuses to show success unless Supabase confirms `read=true`.
- After acknowledgement, the client immediately reloads message state from `private_messages`.
- ACKNOWLEDGE now surfaces the actual Supabase/RLS error instead of silently logging it.

No SQL migration is required if Phase 2.3 SQL was already run.
Preserve the existing `js/supabase-config.js` during deployment.
