#!/usr/bin/env bash
# Records a grab sequence in the real game (headless Chrome over CDP), one PNG per simulation tick.
# usage: scripts/verify/grab_rec.sh <name> <steps>   e.g. grab_rec.sh pummel "l,w250,l,w300,l,w300,l,w300,l,w500,l,w500,l,w500,l,w500,l"
# Output: docs/tmp/grab-rec/<name>/ (git-ignored). Then: python3 scripts/verify/grab_sheet.py docs/tmp/grab-rec/<name> 30 90 3 4 out.png
set -euo pipefail
cd "$(dirname "$0")/../.."
fp() { python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])'; }
V=$(fp); C=$(fp); T=$(mktemp -d)
node node_modules/vite/bin/vite.js --port "$V" --strictPort >"$T/v.log" 2>&1 & VP=$!
google-chrome --headless=new --remote-debugging-port="$C" --user-data-dir="$T/p" --no-first-run about:blank >"$T/c.log" 2>&1 & CP=$!
trap 'kill $VP $CP 2>/dev/null || true; rm -rf "$T" 2>/dev/null || true' EXIT
sleep 5
rm -rf "docs/tmp/grab-rec/$1"
node scripts/verify/grab_rec.mjs "$C" "http://127.0.0.1:$V/" "$1" "$2"
