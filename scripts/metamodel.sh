#!/bin/bash
# ============================================================================
# scripts/metamodel.sh — refresh the vendored LSP metaModel mirror
# ----------------------------------------------------------------------------
# Fetches the canonical Language Server Protocol metaModel instance, verifies
# it parses and carries a version, and lands it as a byte-exact copy at
# tests/mirrors/metaModel.json. Takes no arguments.
# ============================================================================

set -euo pipefail

SOURCE_URL="https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/metaModel/metaModel.json"
DEST_PATH="tests/mirrors/metaModel.json"

cd "$(dirname "$0")/.."

TMP_FILE="$(mktemp)"
cleanup_metamodel_tmp() {
  rm -f -- "$TMP_FILE"
}
trap cleanup_metamodel_tmp EXIT

if ! curl -fsSL -o "$TMP_FILE" "$SOURCE_URL"; then
  echo "metamodel.sh: fetch failed for $SOURCE_URL"
  exit 1
fi

VERSION="$(node -e "process.stdout.write(JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')).metaData.version)" "$TMP_FILE")" || {
  echo "metamodel.sh: fetched file did not parse as JSON with a metaData.version"
  exit 1
}

DIGEST="$(node -e "process.stdout.write(require('node:crypto').createHash('sha256').update(require('node:fs').readFileSync(process.argv[1])).digest('hex'))" "$TMP_FILE")"

echo "metamodel.sh: fetched version ${VERSION}, sha256 ${DIGEST}"

mkdir -p "$(dirname "$DEST_PATH")"
mv "$TMP_FILE" "$DEST_PATH"
trap - EXIT

exit 0
