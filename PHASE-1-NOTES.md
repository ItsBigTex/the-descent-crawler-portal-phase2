# Phase 1.10 Health Formula, Editable GM Notes & Varied Loot

- Max HP uses the requested campaign formula: 10 human Base Health + (CON Mod × Level) + Flat/Manual Bonuses.
- Max HP can be manually adjusted up/down for temporary or equipment effects.
- Current HP is capped when Max HP decreases.
- GM Notes on each Crawler HUB are editable text.
- GM Console now has GM Notes Deployment with load-current and deploy controls for a selected crawler.
- Loot generation now re-rolls naming, effect phrasing, and System-description variants on every Generate Reward click while continuing to interpret the current GM Request for item type, intended effect, and theme.
- Phase 1 remains a local procedural generator; true arbitrary natural-language AI generation is a Phase 2 backend feature.

# Phase 1.9 Skill Descriptions & Themed Loot Generation

- Skills now display an Effect / Description and newly-added skills include an Effect / Description field.
- Existing starter skills have intentionally modest descriptions based on what each skill represents; Rank remains the progression mechanism.
- Loot generation now interprets requested item type, requested purpose/effect, and tone/theme cues.
- Recognized tone cues include funny/silly, serious/grim, demonic/infernal, and cursed/haunted.
- Recognized intent includes appraisal/inspection/value, stealth, repair/technical, protection, and offensive requests.
- Generated System Descriptions are longer and themed, and the GM can freely edit Effect and System Description before awarding.
- This remains a Phase 1 local generator. Phase 2 can use the same GM Request field with a secure LLM backend for genuinely open-ended interpretation.

# Phase 1.8 Mana, Inventory Effects & Request-Aware Rewards

- Max Mana now follows the crawler's current INT Stat, consistent with the core rulebook's Enhanced Intelligence rule, plus a manual Mana bonus for equipment/other effects.
- Current Mana is interactive with +1 / -1 controls; Max Mana has +/- bonus controls and Current Mana is capped at Max.
- Spells now include Mana Cost. Attack/To-Hit casting checks available Mana, spends the cost, then rolls.
- Inventory items now include Effect / Description.
- Reward generation now interprets GM Request keywords such as cloak/cape, armor, boots, gloves, weapon, potion/healing, mana, accessory, and tool/kit/repair, and generates that requested item type instead of appending the request as text.
- The Phase 1 generator remains local/procedural. True open-ended AI prompt interpretation requires the secure Phase 2 backend.

# Phase 1.7 Character Progression, Spells & Reward Awarding

- Fresh state key resets all crawlers to source defaults: Level 1 and original starting Stat arrays.
- Skills: rank +/−, add, remove, and roll.
- Spells: add/remove, rank +/−, Name, Distance, Attribute, Description/Effect, Damage Dice.
- Spell Attack/To-Hit rolls d20 + selected attribute modifier.
- Spell Damage parses formulas such as 1D8, 2D6, and 2D6+3 and rolls all dice.
- Equipment now stores an Effects field.
- GM Loot Workshop now has GENERATE REWARD. In Phase 1 this is a local crawler-aware procedural generator, not a cloud AI call; this avoids exposing API secrets in the public GitHub Pages JavaScript.
- AWARD CONTENTS TO CRAWLER records the reward as CLAIMED and routes generated consumables to Inventory and equipment/gear to Equipment.
- Phase 2 can replace the local generator with a secure server-side AI endpoint while keeping the same UI.

# Phase 1.6 Inventory & Equipment Management

Added to the crawler HUD:
- Equipment: add gear with a name and type/slot; remove gear with confirmation.
- Inventory: add new items with name, type and quantity.
- Existing inventory stacks now have − / + quantity controls.
- Adding an item with the same name (case-insensitive) increases the existing stack instead of creating a duplicate.
- USE / -1 still consumes one item; zero-quantity stacks are removed.
- REMOVE ALL deletes an entire inventory stack with confirmation.
- Inventory/equipment changes are written to the Dungeon Feed.

Example: a crawler with Standard Healing Potion ×1 can press + to make it ×2, or use Add Inventory Item and enter Standard Healing Potion with quantity 3 to make the existing stack ×4.

# Phase 1.5 Stat Correction + Loot Workshop

Added:
- Corrected Philip → Phillip throughout the shipped crawler data/UI.
- Floor 3 stat assignment now has both + and − controls.
- A − stat action returns one assigned point to the bank and can never reduce a Stat below that crawler's original starting value.
- Added GM AI Loot Workshop.
- Phase 1 Loot Workshop builds a crawler-aware, rules-conscious prompt from player-safe job/skill/hobby context and current sheet state.
- Generated results can be pasted back into the console and staged as an UNCLAIMED reward.
- No API secret is placed in the public GitHub Pages code. Direct in-console AI generation is reserved for Phase 2/backend integration.

# Phase 1.4 Controls & Status Update

Added:
- Level Up and Level Down controls.
- Floor Up and Floor Down controls.
- Level Down removes 3 unspent banked stat points. It is blocked below Level 1 and when fewer than 3 unspent points remain, protecting already-assigned stats from accidental rollback.
- Floor remains minimum 1. Moving to Floor 3 automatically exposes banked stat allocation controls.
- Player quest statuses are interactive: ACTIVE, UPDATED, FAILED, COMPLETE.
- Achievement rewards now track UNCLAIMED / CLAIMED.
- GM-awarded achievements default to UNCLAIMED.
- Quest and reward status changes are written to the Dungeon Feed.

# Phase 1.3 Stat Banking Hotfix

Changed level-up behavior:
- Crawlers may level up repeatedly without spending stat points.
- Every level gained banks exactly 3 stat points.
- Banked stat points accumulate across Floors 1 and 2.
- Stat `+1` allocation controls remain hidden/locked until the crawler's `floor` value is 3 or higher.
- Once Floor 3 begins, all banked points become available for assignment across STR, DEX, CON, INT, and CHA.

Example: a crawler starting at Level 1 who reaches Level 9 has gained 8 levels × 3 points = 24 banked stat points. Those 24 points remain unassigned until Floor 3.

# Phase 1.2 Feature Update

Added:
- Player Level Up button. Each level grants exactly 3 spendable stat points across STR/DEX/CON/INT/CHA.
- Multi-dice roller supporting 1–100 dice of d4/d6/d8/d10/d12/d20/d100 with individual results and total.
- GM Quest Assignment matching Achievement Quick Award.
- GM Private System Messages with crawler-specific popup + Messages tab.
- GM dashboard unread-message and active-quest counters.

Phase 1 limitation: all changes still live only in the browser that made them. The private-message workflow is fully modeled, but true GM-device → player-device delivery begins in Phase 2 with Supabase realtime sync.

# Phase 1.1 Hotfix

This build fixes empty crawler selectors on GitHub Pages.

- All six crawler records are embedded in `js/crawler-data.js`.
- `data/crawlers.json` remains as the editable/reference JSON.
- The local-storage key was versioned so a stale or empty Phase 1 cache cannot suppress crawler records.
- All paths remain relative and the app still deploys from repository root.

# Phase 1 GM Notes

- Player edits are local to the browser. This is intentional for the prototype.
- `gm.html` is not protected in Phase 1. Do not store GM-only intake secrets or off-limits material in this repository.
- The portal deliberately excludes private intake answers and horror triggers.
- No starting spells are assigned automatically.
- Replace `Starting Weapon Skill` with the actual weapon skill once each crawler's entry equipment is finalized.
- Brad/Kord: only clearly entry-relevant portable gear is seeded; vehicle/home gear is not assumed to have entered the Dungeon.
