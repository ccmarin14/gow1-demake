#!/usr/bin/env bash
# Browser check of a change: starts Vite and headless Chrome on free ports, runs
# scripts/verify/capture.mjs and stops only the processes it started.
# Usage: scripts/verify/browser-check.sh [out.json] [-- extra capture args]
# Example: SCENARIO=legionnaire scripts/verify/browser-check.sh /tmp/run.json -- 20 square2:10
# Prints `frames N errors E failed F`; the result must be errors 0 and failed 0.
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT="${1:-$(mktemp -d)/capture.json}"
[ "${2:-}" = "--" ] && shift 2 || shift $(( $# > 0 ? 1 : 0 ))
ARGS=("$@")
[ ${#ARGS[@]} -eq 0 ] && ARGS=(20)
free_port() { python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])'; }
VITE_PORT=$(free_port); CDP_PORT=$(free_port); TMP=$(mktemp -d)
node node_modules/vite/bin/vite.js --port "$VITE_PORT" --strictPort >"$TMP/vite.log" 2>&1 & VITE_PID=$!
google-chrome --headless=new --remote-debugging-port="$CDP_PORT" --user-data-dir="$TMP/profile" --no-first-run about:blank >"$TMP/chrome.log" 2>&1 & CHROME_PID=$!
cleanup() { kill "$VITE_PID" "$CHROME_PID" 2>/dev/null || true; }
trap cleanup EXIT
sleep 7
timeout 150 node scripts/verify/capture.mjs "$CDP_PORT" "http://127.0.0.1:$VITE_PORT/" "$OUT" "${ARGS[@]}"
echo "capture: $OUT"
