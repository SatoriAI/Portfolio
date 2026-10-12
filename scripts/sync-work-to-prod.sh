#!/usr/bin/env bash
# Make production's skills and roles match the local database, translations
# included (see backend/portfolio/work/content.py for what is matched and how).
#
#   scripts/sync-work-to-prod.sh            report what would change, write nothing
#   scripts/sync-work-to-prod.sh --apply    write it, in one transaction
#
# The content is exported from the local Docker backend and sent to the Railway
# service in chunks, then imported there. Not in one go: `railway ssh` joins
# its command into one remote shell line, a script piped to its stdin once
# timed out mid-run, and one argument holding the whole file is long. Base64
# chunks are single words, safe through the remote shell, and the whole file is
# checked against its local checksum before anything is imported.
#
# REMOTE=docker runs the same steps against the local container instead, as a
# rehearsal.
set -euo pipefail

PROJECT=${RAILWAY_PROJECT:-0e909390-be80-4ea8-9322-42279b5b559b}
ENVIRONMENT=${RAILWAY_ENVIRONMENT:-a2bf9e2d-6769-4c0f-9298-0e3e020da644}
SERVICE=${RAILWAY_SERVICE:-bb8b2549-2cdb-4e7c-a7af-545b8a2bee85}
LOCAL_CONTAINER=${LOCAL_CONTAINER:-portfolio-backend}
REMOTE=${REMOTE:-railway}
CHUNK=${CHUNK:-8000}

case "${1:-}" in
  "" | --apply) mode=${1:-} ;;
  *) echo "usage: $0 [--apply]" >&2; exit 2 ;;
esac

remote() {
  if [[ $REMOTE == docker ]]; then
    docker exec -w /source "$LOCAL_CONTAINER" sh -c "$1"
  else
    railway ssh --project "$PROJECT" --environment "$ENVIRONMENT" --service "$SERVICE" -- "$1"
  fi
}

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

docker exec -w /source/portfolio "$LOCAL_CONTAINER" python manage.py export_work > "$work/work.json"
python3 -c 'import json, sys; json.load(open(sys.argv[1]))' "$work/work.json"
sum=$(shasum -a 256 "$work/work.json" | cut -d' ' -f1)
target=/tmp/work-content-$sum.json

# fold leaves the last line without a newline, and read would drop it.
{ base64 < "$work/work.json" | tr -d '\n' | fold -w "$CHUNK"; echo; } > "$work/chunks"
total=$(wc -l < "$work/chunks" | tr -d ' ')
echo "Sending $(wc -c < "$work/work.json" | tr -d ' ') bytes in $total chunk(s) to $REMOTE…"
n=0
while IFS= read -r chunk; do
  n=$((n + 1))
  if [[ $n == 1 ]]; then op='>'; else op='>>'; fi
  remote "printf %s $chunk $op $target.b64"
done < "$work/chunks"

remote "base64 -d $target.b64 > $target \
  && echo '$sum  $target' | sha256sum -c --quiet - \
  && python portfolio/manage.py import_work $target $mode; \
  status=\$?; rm -f $target $target.b64; exit \$status"
