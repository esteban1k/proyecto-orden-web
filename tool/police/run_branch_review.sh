#!/bin/sh
# Branch vs base preflight (no open PR). Emits Police markdown to stdout.
set -eu
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
BASE="${BASE_REF:-origin/main}"
BRANCH="${BRANCH_REF:-HEAD}"
AFTER="$(git rev-parse "$BRANCH")"
BEFORE="$(git merge-base "$BASE" "$AFTER" 2>/dev/null || true)"
if [ -z "$BEFORE" ]; then
  echo "<!-- police:blocker -->" >&2
  echo "- **blocker** · cannot merge-base $BASE and $BRANCH" >&2
  exit 1
fi
COMMITS_FILE="$(mktemp)"
trap 'rm -f "$COMMITS_FILE"' EXIT
sh tool/police/list_push_commits.sh "$BEFORE" "$AFTER" "$BASE" >"$COMMITS_FILE"
export COMMITS_FILE
python3 tool/police/commit_hygiene.py \
  --commits-file "$COMMITS_FILE" \
  --branch "$(git branch --show-current)"
python3 tool/police/secret_scan.py --commits-file "$COMMITS_FILE"