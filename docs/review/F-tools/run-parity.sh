#!/usr/bin/env bash
# Owner: agent/stickman. Re-checks docs/review/F-201-parity-exact.txt from a clean checkout.
#
# Feeds docs/reference/stickman-cursor-spike.html (the owner-approved prototype) and
# /stickman-lab.html (the production cursor controller) identical real mouse input under a
# virtual 60 fps clock in headless system Chrome, then compares their canvases pixel for pixel.
#
# Needs: macOS Google Chrome, Node 22+, python3, and `npm run dev` already running
# (scripts/bootstrap.sh && source .env && npm run dev). Exits non-zero on any difference.
set -euo pipefail
cd "$(dirname "$0")/../../.."
set -a; source .env; set +a
REF_PORT="${REF_PORT:-$((FRONTEND_PORT + 190))}"

python3 -I -m http.server "$REF_PORT" --bind 127.0.0.1 --directory docs/reference >/dev/null 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT
for _ in 1 2 3 4 5 6 7 8 9 10; do
  curl -s -o /dev/null "http://127.0.0.1:$REF_PORT/stickman-cursor-spike.html" && break
  sleep 0.3
done

out="$(SPIKE_URL="http://127.0.0.1:$REF_PORT/stickman-cursor-spike.html" \
  LAB_URL="http://localhost:$FRONTEND_PORT/stickman-lab.html" \
  node docs/review/F-tools/parity-exact.mjs)"
printf '%s\n' "$out"
grep -q " identical, 0 different checkpoints" <<<"$out"
