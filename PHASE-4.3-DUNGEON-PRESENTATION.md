# Phase 4.3 — Dungeon Presentation Engine

## Full-screen physics-style dice
Crawler rolls now use a full-screen canvas presentation:
- dice enter with velocity, gravity, spin, wall/floor collision and bounce damping
- d4/d6/d8/d10/d12/d20 visual silhouettes
- multi-die rolls animate together (up to 8 visible dice; all rolled values still resolve)
- final value is the existing game result; presentation does not change roll mechanics
- natural 20 / natural 1 System flavor retained
- Web Audio bounce cues

This is intentionally self-contained and has no external 3D library dependency.

## System Audio Engine
Crawler HUD now includes AUDIO controls:
- Master / Voice / SFX / Ambience volume
- Voice on/off
- SFX on/off
- System test
- generated low ambience on/off

System notifications automatically:
1. play a category cue
2. narrate event label + title + body through browser SpeechSynthesis

Achievement, Quest, Loot, Health/Warning, Level and generic System events have distinct generated cues.

## Privacy / deployment
- No TTS API key is required.
- Voice uses the browser/device speech engine.
- SFX/ambience use Web Audio and are generated locally.
- Browser audio may require one click/tap before sound is permitted.
- No SQL migration required.

## Compatibility
4.2 Dungeon Director remains intact. This phase changes presentation, not RAW mechanics.
