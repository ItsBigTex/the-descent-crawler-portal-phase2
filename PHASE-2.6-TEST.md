# Phase 2.6 — Loot Box Reveal System

Built on the confirmed-working Phase 2.5 release.

## New
- Crawler portal has a LOOT tab.
- GM `STAGE AS UNOPENED LOOT BOX` sends a sealed reward to the selected crawler.
- Live `NEW LOOT BOX!` System popup appears without refresh.
- Sealed boxes hide contents until the crawler presses OPEN BOX.
- Opening produces a `LOOT BOX OPENED!` reveal, records a claimed achievement, and transfers recognized reward content into Equipment/Inventory.
- Opened boxes remain in Loot history with their revealed contents.
- `AWARD CONTENTS DIRECTLY` preserves the previous immediate-transfer workflow.
- Ollama and mandatory offline fallback behavior are unchanged.

## Test
1. Keep Marvin logged in on any tab.
2. GM generate a Bronze reward and choose STAGE AS UNOPENED LOOT BOX.
3. Marvin should immediately receive NEW LOOT BOX without refresh.
4. Marvin's LOOT tab should show the box as SEALED with no contents visible.
5. Press OPEN BOX. Confirm the reveal popup shows the contents.
6. Confirm the box remains in LOOT as OPENED.
7. Confirm the reward appears in Inventory or Equipment as appropriate.
8. Confirm a claimed `LOOT OPENED:` achievement was recorded.
9. Refresh Marvin and confirm all opened-box state/content persists.
10. Re-test private messages, quests, achievements, party progression, Ollama generation, and Ollama-offline fallback.
