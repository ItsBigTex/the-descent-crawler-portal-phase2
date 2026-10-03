# Phase 4.4.1 Test
1. Replace the Foundry module folder and restart Foundry.
2. Enable The Descent Bridge.
3. Configure Settings → Module Settings → The Descent Bridge → INITIALIZE FLOOR 1.
4. Initialize and confirm THE DESCENT — FLOOR 1 contains 10 blank scenes.
5. Confirm THE DESCENT — REFERENCE contains Floor 1 Reference Bible.
6. Run initializer again; it should update, not duplicate, managed scenes.
7. Console: `TheDescentBridge.FLOOR1_SCENES.map(x=>x[1])`
8. Console: `await TheDescentBridge.handleCommand('activate_scene',{name:"R&R Cards and Games — 403 Fisk"})`
9. Confirm prior System announcement/playlist commands still work.
