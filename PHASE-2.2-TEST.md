# Phase 2.2 — In-place Realtime + Persistent Dungeon Feed

## Fixes
- Realtime crawler updates no longer force a browser reload.
- The active Character HUD tab stays selected when another client changes that crawler.
- Dungeon Feed history now loads from `public.activity_feed` on page load instead of being reset to an empty local array.
- New activity-feed rows arrive through Supabase Realtime and update the GM feed without a full-page reload.

## Test
1. Preserve your existing `js/supabase-config.js` when uploading this package.
2. Sign in as GM and Phillip in separate browser sessions.
3. On Phillip, select a non-Character tab such as Dice.
4. Roll dice or make a crawler change. Confirm Phillip remains on the same tab.
5. Make a GM-side change to Phillip. Confirm Phillip updates without returning to Character.
6. In GM Console, perform several actions/rolls. Confirm Dungeon Feed keeps prior entries.
7. Refresh the GM page. Confirm the feed history returns from Supabase rather than showing `No activity yet`.
8. Repeat with Marvin.
