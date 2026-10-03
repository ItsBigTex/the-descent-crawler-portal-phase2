# Phase 4.4 Test

## Portal
1. Confirm `window.DESCENT_GM_BUILD` is `4.4`.
2. Confirm FOUNDRY BRIDGE workspace appears.
3. Open Bridge Settings. Confirm it explicitly says not to use a Foundry license key.

## Foundry
4. Copy `foundry-module/the-descent-bridge` into Foundry User Data `Data/modules/`.
5. Restart Foundry and enable The Descent Bridge in the World.
6. Configure a bridge token in Module Settings.
7. Open browser developer console in Foundry and confirm `TheDescentBridge.status()` returns world/version/scene data.
8. Create or use an existing Scene. In console test:
   `await TheDescentBridge.handleCommand('activate_scene',{name:'YOUR EXACT SCENE NAME'})`
9. Create/use a Playlist and test:
   `await TheDescentBridge.handleCommand('play_playlist',{name:'YOUR EXACT PLAYLIST NAME'})`
10. Test:
   `await TheDescentBridge.handleCommand('system_announcement',{text:'HELLO, CRAWLERS.'})`
   Confirm styled System chat appears.
11. Test encounter receipt with:
   `await TheDescentBridge.handleCommand('encounter',{name:'Bridge Test',round:1,phase:'crawlers'})`

## Transport
12. The GM Portal TEST CONNECTION will require the local host adapter described in the README. A stock Foundry client module cannot create that HTTP route by itself. Do not expose a bridge adapter publicly.

## Regression
13. Confirm 4.3 audio and dice still work.
14. Confirm 4.2 Dungeon Director still works.
15. Confirm AI Content Studio Pool Cue regression still passes.
