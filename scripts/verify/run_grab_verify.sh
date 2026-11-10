#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

free_port() { python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])'; }
VITE_PORT=$(free_port); CDP_PORT=$(free_port); TMP=$(mktemp -d)

node node_modules/vite/bin/vite.js --port "$VITE_PORT" --strictPort >"$TMP/vite.log" 2>&1 & VITE_PID=$!
google-chrome --headless=new --remote-debugging-port="$CDP_PORT" --user-data-dir="$TMP/profile" --no-first-run about:blank >"$TMP/chrome.log" 2>&1 & CHROME_PID=$!

cleanup() { kill "$VITE_PID" "$CHROME_PID" 2>/dev/null || true; rm -rf "$TMP" || true; }
trap cleanup EXIT

sleep 5
node scripts/verify/verify_grabs_browser.mjs "$CDP_PORT" "http://127.0.0.1:$VITE_PORT/" "docs/tmp/grab-verify"
