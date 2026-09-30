# Phase 2.4 Community Edition — Ollama

No paid AI API is required. The GM browser talks to Ollama running on the GM computer. Supabase remains responsible for login/cloud campaign state.

## 1. Install Ollama
Install Ollama from its official installer for your OS.

## 2. Install a model
Open Terminal / PowerShell and run:
`ollama pull llama3.2:3b`

The portal defaults to model `llama3.2:3b`. You may change the model in GM Console -> AI Loot Workshop.

## 3. Allow the portal origin
A browser page hosted on GitHub Pages is a different web origin from local Ollama. Ollama must allow the portal origin.

Windows: close Ollama if already running, then run `start-ollama-windows.bat` from this package and leave its window open while using the Loot Workshop.

macOS/Linux: run `chmod +x start-ollama-macos-linux.sh` once, then `./start-ollama-macos-linux.sh`.

The included launchers set `OLLAMA_ORIGINS` for `https://itsbigtex.github.io` plus localhost development origins.

## 4. Deploy portal
Upload the web files to the Phase 2 GitHub Pages repository. Preserve your configured `js/supabase-config.js`.

## 5. Test
GM Console -> AI Loot Workshop -> TEST CONNECTION.
It should report LOCAL AI ONLINE and list installed models.
Select Marvin, Bronze, enter a request, then GENERATE REWARD.

## Mandatory fallback behavior
Every generation tries Ollama first. If Ollama is unavailable, times out, has a missing model, returns HTTP failure, or returns invalid JSON, the existing procedural generator runs automatically.

When fallback is used, the Generated contents field ALWAYS starts exactly with:
`SYSTEM AI OFFLINE — FALLBACK PERSONALITY SUBROUTINE ENGAGED`

This makes it visually impossible to mistake procedural fallback content for Ollama-generated content.

## Privacy/security
No OpenAI key or other paid AI credential is used.
The local Ollama endpoint has no API key in this design. Only allow trusted origins and do not expose port 11434 directly to the public internet.
Player-safe crawler profiles are sent to the local model for personalization; private/off-limits intake material is not included.
