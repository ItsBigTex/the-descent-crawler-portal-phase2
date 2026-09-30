#!/bin/sh
export OLLAMA_ORIGINS="https://itsbigtex.github.io,http://localhost:*,http://127.0.0.1:*"
echo "Starting Ollama for The Descent Crawler Portal..."
ollama serve
