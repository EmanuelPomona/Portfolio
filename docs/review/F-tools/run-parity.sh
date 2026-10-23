#!/usr/bin/env bash
# Owner: agent/stickman. Re-checks docs/review/F-201-parity-exact.txt from a clean checkout.
#
# Feeds docs/reference/stickman-cursor-spike.html (the owner-approved prototype) and
# /stickman-lab.html (the production cursor controller) identical real mouse input under a
# virtual 60 fps clock in headless system Chrome, then compares their canvases pixel for pixel.
#
# Needs: macOS Google Chrome, Node 22+, python3, and `npm run dev` already running
# (scripts/bootstrap.sh && source .env && npm run dev). Exits non-zero on any difference.
#
# Owner changes since the prototype are applied to a temporary copy of the reference and printed;
# docs/reference is never edited. The gate stays green by design and still catches any other
# difference. PARITY_PURE=1 compares against the reference exactly as committed.
#   TASK-207 (owner): he starts to sit SIT_AFTER_S after the POINTER stops (the spike: 5s after he
#   stops), and eases in at SIT_EASE (the spike: 4/s); both read from engine/gestures.ts.
set -euo pipefail
cd "$(dirname "$0")/../../.."
set -a; source .env; set +a
REF_PORT="${REF_PORT:-$((FRONTEND_PORT + 190))}"

ref_dir="$(mktemp -d)"
server=""
trap '[ -n "$server" ] && kill "$server" 2>/dev/null; rm -f "$ref_dir"/*; rmdir "$ref_dir"' EXIT
cp docs/reference/stickman-cursor-spike.html "$ref_dir/"
if [ "${PARITY_PURE:-0}" = 1 ]; then
  echo "reference: docs/reference/stickman-cursor-spike.html as committed (PARITY_PURE=1)"
else
  # Each owner change must match exactly once, or the gate fails rather than compare the wrong thing.
  python3 -I - "$ref_dir/stickman-cursor-spike.html" frontend/src/stickman/engine/gestures.ts <<'PY'
import re, sys
spike, gestures = sys.argv[1], sys.argv[2]
src = open(gestures).read()
sit = re.search(r"^export const SIT_AFTER_S = ([0-9.]+);", src, re.M).group(1)
ease = re.search(r"^const SIT_EASE = ([0-9.]+);", src, re.M).group(1)
changes = [
    ("sit threshold and ease (TASK-207)",
     "man.sit += ((man.idle > 5 ? 1 : 0) - man.sit) * Math.min(1, dt * 4);",
     f"man.sit += ((man.idle > {sit} ? 1 : 0) - man.sit) * Math.min(1, dt * {ease});"),
    ("idle is the pointer's stillness: his own movement no longer resets it, and the frame that sees a pointer move counts none (TASK-207)",
     "man.idle = moving ? 0 : man.idle + dt;",
     "man.idle = man.ptrMoved ? 0 : man.idle + dt; man.ptrMoved = false;"),
    ("idle is the pointer's stillness: a pointermove that changes the target flags it (TASK-207)",
     "target.x = e.clientX; target.y = e.clientY;",
     "if (e.clientX !== target.x || e.clientY !== target.y) man.ptrMoved = true; target.x = e.clientX; target.y = e.clientY;"),
]
html = open(spike).read()
for label, old, new in changes:
    n = html.count(old)
    if n != 1:
        sys.exit(f"cannot apply owner change '{label}': {n} matches in the reference")
    html = html.replace(old, new)
open(spike, "w").write(html)
print(f"reference: a temporary copy with the owner's TASK-207 changes: sit {sit}s after the pointer stops, eased at {ease}/s")
PY
fi

python3 -I -m http.server "$REF_PORT" --bind 127.0.0.1 --directory "$ref_dir" >/dev/null 2>&1 &
server=$!
for _ in 1 2 3 4 5 6 7 8 9 10; do
  curl -s -o /dev/null "http://127.0.0.1:$REF_PORT/stickman-cursor-spike.html" && break
  sleep 0.3
done

out="$(SPIKE_URL="http://127.0.0.1:$REF_PORT/stickman-cursor-spike.html" \
  LAB_URL="http://localhost:$FRONTEND_PORT/stickman-lab.html" \
  node docs/review/F-tools/parity-exact.mjs)"
printf '%s\n' "$out"
grep -q " identical, 0 different checkpoints" <<<"$out"
