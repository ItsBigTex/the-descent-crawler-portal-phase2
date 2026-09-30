# Phase 2.3.3 Hotfix — GM crawler actions persist to Supabase

Observed issue: Achievement Quick Award, Quest Assignment, and GM Notes Deployment changed only the GM browser's local state. They called `addFeed()` but never called the cloud crawler save path, so refreshing a crawler loaded the unchanged database row.

Fix:
- These three GM actions now call `saveCrawlerNow(crawler)` and wait for Supabase to confirm the updated crawler row before reporting success.
- Failures now show an explicit on-screen error.
- Normal crawler saves strip `messages` from crawler JSON because private messages are authoritative in `public.private_messages`.

No SQL migration is required.
Preserve `js/supabase-config.js` when deploying.
