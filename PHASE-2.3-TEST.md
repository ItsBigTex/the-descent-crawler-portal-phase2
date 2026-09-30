# Phase 2.3 — Realtime Private System Messages

## What changed
- GM private System messages now use `public.private_messages` rather than being embedded only inside crawler JSON.
- Crawler login loads its message history from Supabase.
- GM can see unread counts based on the database-backed message list.
- New messages arrive through Supabase Realtime without a page reload.
- ACKNOWLEDGE updates the message's `read` flag in Supabase and synchronizes that status back to the GM.
- Dungeon Feed remains persistent and records that a private message was delivered, but never exposes the private message body.

## One-time database check
Run `supabase/phase-2.3.sql` in Supabase SQL Editor. It only ensures `private_messages` is in the Realtime publication and is safe if it is already present.

## Test
1. Preserve your existing `js/supabase-config.js` when uploading this package.
2. Run `supabase/phase-2.3.sql`.
3. Open GM Console and Phillip in separate sessions.
4. GM sends Phillip a private System message.
5. Phillip should receive it without refreshing.
6. Phillip opens MESSAGES and clicks ACKNOWLEDGE.
7. Confirm `public.private_messages.read` becomes true and the GM unread count updates.
8. Refresh both pages and confirm the message remains.
9. Repeat with Marvin.
10. Confirm Phillip never receives Marvin's private messages and Marvin never receives Phillip's.
