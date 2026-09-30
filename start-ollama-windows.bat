@echo off
set OLLAMA_ORIGINS=https://itsbigtex.github.io,http://localhost:*,http://127.0.0.1:*
echo Starting Ollama for The Descent Crawler Portal...
echo Keep this window open while using AI Loot Workshop.
ollama serve
pause
