# Phase 2.1 Test — GM + Phillip + Marvin

IMPORTANT: This ZIP intentionally does NOT contain `js/supabase-config.js`, so uploading it will not overwrite the working Project URL/publishable key already in GitHub. It includes `js/supabase-config.example.js` only.

## Deploy
Upload the contents of this ZIP to the root of the existing `the-descent-crawler-portal-phase2` repository and replace matching files. Do not delete your existing `js/supabase-config.js`.

## Test A — GM
1. Open the Pages site in a private/incognito window.
2. Sign in with the GM Supabase Auth account.
3. Confirm lower-right status says `CLOUD LIVE // GM`.
4. Confirm the crawler selector loads the database crawler records.
5. Open Phillip and edit GM Notes, HP, or inventory. Wait for `CLOUD SAVED`.
6. In Supabase Table Editor → crawlers → Phillip, confirm the `data` JSON changed.

## Test B — Phillip
1. Use a different browser/private profile and open the same site.
2. Sign in as Phillip.
3. The portal should show only Phillip's crawler card.
4. Confirm the GM change from Test A is visible.
5. Make a harmless change. The GM window should receive a realtime update and refresh.

## Test C — Marvin
Repeat Test B with Marvin. Marvin should see only Marvin.

## Security
- A crawler account visiting `gm.html` should receive ACCESS DENIED.
- RLS should prevent Phillip from reading/updating Marvin and vice versa.
- Never put a service-role/secret key in GitHub.

## Troubleshooting
- `No crawler record is mapped...`: check `public.profiles.crawler_id` exactly matches `public.crawlers.id`.
- `CLOUD WRITE FAILED`: capture the full lower-right message; likely RLS/profile mapping.
- Login works but data does not load: confirm the profile UUID exactly matches Authentication → Users UUID.
