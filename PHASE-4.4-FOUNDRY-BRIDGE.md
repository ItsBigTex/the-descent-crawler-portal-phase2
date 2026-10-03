# Phase 4.4 — Foundry Bridge

This phase creates the first Foundry VTT v14 module and adds a FOUNDRY BRIDGE workspace to the GM Console.

## Portal controls
- Bridge URL/token configuration
- connection status
- activate existing Foundry Scene by exact name
- play existing Foundry Playlist by exact name
- send System announcement
- send current encounter presentation metadata

## Foundry module
`foundry-module/the-descent-bridge/`

The module:
- registers world settings for bridge enable/token
- requests a module socket namespace
- exposes a Foundry-side command processor
- activates existing Scenes
- plays existing Playlists
- creates System/Encounter chat presentation
- emits bridge events

## Deliberate safety boundary
Foundry remains presentation in 4.4. It does not calculate crawler mechanics, modify Portal stats, auto-award loot, or auto-deploy encounters.

## Connection boundary
Foundry add-on modules execute client-side. They do not automatically add arbitrary HTTP routes to the Foundry server. The Portal HTTP transport is isolated so a local host adapter can be added without rewriting the Portal or module command processor.

No SQL migration required.
