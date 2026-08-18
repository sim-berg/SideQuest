#!/usr/bin/env bash
#
# lane.sh — isolierte Arbeitsumgebung für eine Claude-Session / einen Menschen.
#
# Jede Lane bekommt: eigenen git-worktree, eigenen Branch, eigene Ports und
# eine eigene Mongo-Datenbank. Mongo und Qdrant laufen weiterhin nur EINMAL
# (aus dem Haupt-Tree, `docker compose up -d mongo qdrant`).
#
# Siehe docs/workflow.md §6.
#
#   ./scripts/lane.sh new <name> <slot 1..3>   Lane anlegen
#   ./scripts/lane.sh list                     alle Lanes + Ports zeigen
#   ./scripts/lane.sh drop <name>              Worktree entfernen
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LANES_DIR="$(dirname "$REPO_ROOT")/SideQuest-lanes"
BASE_BRANCH="develop"

# Slot 0 ist der Haupt-Tree (3002 / 5173). Lanes fangen bei Slot 1 an.
backend_port() { echo $((3002 + $1 * 10)); }
frontend_port() { echo $((5173 + $1 * 10)); }

die() {
  echo "✗ $*" >&2
  exit 1
}

cmd_new() {
  local name="${1:-}" slot="${2:-}"
  [[ -n "$name" ]] || die "Name fehlt.  ./scripts/lane.sh new <name> <slot 1..3>"
  [[ "$slot" =~ ^[1-3]$ ]] || die "Slot muss 1, 2 oder 3 sein (0 = Haupt-Tree)."
  [[ "$name" =~ ^[a-z0-9][a-z0-9-]*$ ]] || die "Name nur klein, a-z0-9 und Bindestriche."

  local branch="lane/$name"
  local dir="$LANES_DIR/$name"
  local be fe db
  be="$(backend_port "$slot")"
  fe="$(frontend_port "$slot")"
  db="sidequest_${name//-/_}"

  [[ -e "$dir" ]] && die "$dir existiert schon. Erst 'lane.sh drop $name'."

  echo "→ fetch origin"
  git -C "$REPO_ROOT" fetch origin --quiet

  local start_point="origin/$BASE_BRANCH"
  git -C "$REPO_ROOT" rev-parse --verify --quiet "$start_point" >/dev/null ||
    start_point="$BASE_BRANCH"

  mkdir -p "$LANES_DIR"

  if git -C "$REPO_ROOT" rev-parse --verify --quiet "$branch" >/dev/null; then
    echo "→ Branch $branch existiert — Worktree wird darauf gesetzt"
    git -C "$REPO_ROOT" worktree add "$dir" "$branch"
  else
    echo "→ Branch $branch von $start_point"
    git -C "$REPO_ROOT" worktree add -b "$branch" "$dir" "$start_point"
    # git setzt sonst origin/develop als Upstream — ein blindes `git push`
    # in der Lane würde direkt auf develop landen. Genau das wollen wir nicht.
    git -C "$dir" branch --unset-upstream 2>/dev/null || true
  fi

  echo "→ backend/.env  (PORT=$be, DB=$db)"
  cat >"$dir/backend/.env" <<EOF
# Automatisch von scripts/lane.sh erzeugt — Lane: $name (Slot $slot)
PORT=$be
APP_URL=http://localhost:$be
MONGODB_URI=mongodb://localhost:27017/$db
JWT_SECRET=sidequest-dev-secret
CORS_ORIGIN=http://localhost:$fe
QDRANT_URL=http://localhost:6343
EOF

  # Tokens aus dem Haupt-Tree übernehmen, damit die Lane sofort arbeitsfähig
  # ist. Nur Zeilen, die tatsächlich einen Wert haben.
  if [[ -f "$REPO_ROOT/backend/.env" ]]; then
    grep -E '^(REPLICATE|ANTHROPIC)[A-Z_]*=.+' "$REPO_ROOT/backend/.env" \
      >>"$dir/backend/.env" || true
  fi

  echo "→ frontend/.env  (API → :$be)"
  cat >"$dir/frontend/.env" <<EOF
# Automatisch von scripts/lane.sh erzeugt — Lane: $name (Slot $slot)
VITE_API_URL=http://localhost:$be/api
VITE_SOCKET_URL=http://localhost:$be
EOF

  if [[ "${3:-}" == "--skip-install" ]]; then
    echo "→ npm install übersprungen"
  else
    echo "→ npm install (backend)"
    (cd "$dir/backend" && npm install --silent)
    echo "→ npm install (frontend)"
    (cd "$dir/frontend" && npm install --silent)
  fi

  cat <<EOF

✓ Lane '$name' bereit

  Verzeichnis   $dir
  Branch        $branch
  Backend       http://localhost:$be
  Frontend      http://localhost:$fe
  Mongo-DB      $db

  cd "$dir"
  npm --prefix backend run start:dev          # :$be
  npm --prefix frontend run dev -- --port $fe # :$fe

  Nicht vergessen:
   1. docs/BOARD.md eintragen und auf develop pushen
   2. docker compose up -d mongo qdrant  (einmal, im Haupt-Tree)

EOF
}

cmd_list() {
  echo "Worktrees:"
  git -C "$REPO_ROOT" worktree list
  echo
  echo "Slot  Backend  Frontend  Lane"
  echo "----  -------  --------  ------------------------------"
  printf "%-4s  %-7s  %-8s  %s\n" 0 3002 5173 "$REPO_ROOT (Haupt-Tree)"
  local slot
  for slot in 1 2 3; do
    local dir="" name=""
    for dir in "$LANES_DIR"/*/; do
      [[ -d "$dir" ]] || continue
      name="$(basename "$dir")"
      if [[ -f "$dir/backend/.env" ]] &&
        grep -q "^PORT=$(backend_port "$slot")$" "$dir/backend/.env"; then
        printf "%-4s  %-7s  %-8s  %s\n" "$slot" \
          "$(backend_port "$slot")" "$(frontend_port "$slot")" "$name"
      fi
    done
  done
}

cmd_drop() {
  local name="${1:-}"
  [[ -n "$name" ]] || die "Name fehlt.  ./scripts/lane.sh drop <name>"
  local dir="$LANES_DIR/$name"
  [[ -d "$dir" ]] || die "$dir gibt es nicht."

  if [[ -n "$(git -C "$dir" status --porcelain)" ]]; then
    die "Lane '$name' hat uncommittete Änderungen. Erst committen/stashen."
  fi

  git -C "$REPO_ROOT" worktree remove "$dir"
  echo "✓ Worktree entfernt. Branch lane/$name bleibt bestehen:"
  echo "  git branch -d lane/$name   # wenn gemergt"
}

case "${1:-}" in
new) shift && cmd_new "$@" ;;
list) cmd_list ;;
drop) shift && cmd_drop "$@" ;;
*)
  cat <<'EOF'
lane.sh — isolierte Arbeitsumgebung pro Session (siehe docs/workflow.md §6)

  ./scripts/lane.sh new <name> <slot 1..3> [--skip-install]
  ./scripts/lane.sh list
  ./scripts/lane.sh drop <name>

Beispiel:
  ./scripts/lane.sh new quest-search 1
EOF
  exit 1
  ;;
esac
