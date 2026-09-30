# The Descent — Phase 2 Starter

## Goal
Move Phase 1 localStorage state into Supabase so crawler changes, GM actions, messages and the activity feed synchronize across devices. Add authentication/RLS and put AI loot generation behind a secure server-side Edge Function.

## Included
- `supabase/schema.sql` — profiles, crawlers, activity feed, private messages, RLS policies and Realtime publication.
- `supabase/seed.sql` — seeds the six current crawler records from Phase 1.10.
- `js/supabase-config.js` — browser-safe Project URL + anon/publishable key placeholders.
- `js/cloud-state.js` — authentication, crawler CRUD, feed and realtime subscription adapter.
- `supabase/functions/generate-loot/index.ts` — GM-only server-side boundary for the future AI provider.
- Existing Phase 1.10 UI remains intact while cloud features are connected incrementally.

## Supabase setup
1. Create a Supabase project.
2. In SQL Editor run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Enable Email authentication in Supabase Auth.
4. Create accounts for the GM and each crawler.
5. Insert/update each user's `profiles` row with `role='gm'` or `role='crawler'`; crawler users also get their crawler ID.
6. Copy the Project URL and anon/publishable browser key into `js/supabase-config.js`. Do NOT use the service-role/secret key in GitHub Pages.
7. Deploy the site.
8. Next development pass: replace the Phase 1 `readState/saveState` calls page-by-page with `DSCloud`, then enable realtime refresh.
9. Deploy the `generate-loot` Edge Function and store the AI provider key as a Supabase secret. The browser should call the Edge Function, never the AI provider directly.

## Recommended migration order
1. Authentication and crawler-to-user mapping.
2. Cloud crawler state and GM dashboard.
3. Realtime crawler updates/activity feed/private messages.
4. AI Loot Workshop Edge Function.
5. Tighten permissions and remove localStorage fallback after table testing.
