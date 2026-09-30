# Phase 2.3.2 Hotfix

Fixes the two regressions observed in 2.3.1.

## GM dropdowns
The 2-second message fallback could trigger GM Console re-renders. `render()` rebuilt every crawler `<select>`, which reset each selection to the first option (Jarod). Phase 2.3.2 preserves each dropdown's selected crawler across renders, and the polling fallback now dispatches a UI refresh only when message data actually changes.

## Live private messages
The crawler's System popup was only evaluated once during initial page load. New messages could reach local state without reopening the popup. Phase 2.3.2 re-evaluates the popup whenever a Realtime event or fallback sync changes messages.

## Acknowledgement
The popup ACKNOWLEDGE button still used the old Phase 1 crawler-JSON save path. It now uses the same verified `private_messages` database update as the Messages-tab ACKNOWLEDGE button. Supabase must confirm `read=true`; otherwise the user sees the actual error.

No new SQL is required. Preserve the configured `js/supabase-config.js`.
