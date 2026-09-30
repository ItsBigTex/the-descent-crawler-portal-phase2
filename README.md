# The Descent Crawler Portal — Phase 1

Static GitHub Pages crawler HUD for **Dungeon Crawler Carl: The Descent**.

## Deploy
1. Create a new GitHub repository named `the-descent-crawler-portal`.
2. Upload **the contents of this folder** to the repository root (do not upload the containing folder as one nested directory).
3. Commit to `main`.
4. In GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**.
5. Select **main** and **/(root)**, then Save.
6. Open the Pages URL GitHub provides.

## Phase 1 behavior
- Six pre-populated crawler files.
- Mobile-friendly Dungeon HUD.
- Stats, skills, spells, equipment, inventory, quests, achievements, dice rolls.
- GM console at `gm.html`.
- Changes persist with browser `localStorage`.
- **No authentication and no cross-device synchronization.** Each browser/device has its own copy of the data.

## Important data note
The campaign's previously proposed stat/skill translations are seeded as starting data. HP/Mana are explicitly editable placeholders until final derived values are locked. Brad/Kord's starting translation is marked provisional and should be reviewed by the GM.

## Phase 2
Replace localStorage with Supabase authentication/database/realtime while keeping the same UI and JSON-shaped character model.
