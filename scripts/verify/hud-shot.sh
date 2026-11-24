#!/usr/bin/env bash
# Starts Vite and headless Chrome, captures the real game canvas with the HUD variant of the URL query.
# Usage: scripts/verify/hud-shot.sh <hud id: pixel|faithful> <out.png> [ticks]
# Prints the capture summary of scripts/verify/hud-shot.mjs; the result must be errors 0 and failed 0.
set -euo pipefail
cd "$(dirname "$0")/../.."
HUD="${1:?usage: hud-shot.sh <pixel|faithful> <out.png> [ticks]}"
OUT="${2:?usage: hud-shot.sh <pixel|faithful> <out.png> [ticks]}"
TICKS="${3:-60}"
free_port() { python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])'; }
VITE_PORT=$(free_port); CDP_PORT=$(free_port); TMP=$(mktemp -d)
node node_modules/vite/bin/vite.js --port "$VITE_PORT" --strictPort >"$TMP/vite.log" 2>&1 & VITE_PID=$!
google-chrome --headless=new --remote-debugging-port="$CDP_PORT" --user-data-dir="$TMP/profile" --no-first-run about:blank >"$TMP/chrome.log" 2>&1 & CHROME_PID=$!
cleanup() { kill "$VITE_PID" "$CHROME_PID" 2>/dev/null || true; }
trap cleanup EXIT
sleep 7
timeout 150 node scripts/verify/hud-shot.mjs "$CDP_PORT" "http://127.0.0.1:$VITE_PORT/?hud=$HUD${EXTRA_QUERY:+&$EXTRA_QUERY}" "$OUT" "$TICKS"
echo "shot: $OUT"
