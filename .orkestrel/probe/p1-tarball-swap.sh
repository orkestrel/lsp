#!/bin/sh
set -eu
# P1 tarball swap: build @orkestrel/lsp from source, pack, install into probe.
# Replaced-range record: /home/user/probe/package.json carries no @orkestrel/lsp
# entry before this install (verified 2026-08-26). Restoration is removal of the
# dependency and lockfile regeneration; the registry serves no published
# @orkestrel/lsp release yet.
cd /home/user/lsp
npm run build
mkdir -p /home/user/scaffold/tmp/tarballs
npm pack --pack-destination /home/user/scaffold/tmp/tarballs
cd /home/user/probe
npm install /home/user/scaffold/tmp/tarballs/orkestrel-lsp-0.0.1.tgz
node -e "const m=require('/home/user/probe/node_modules/@orkestrel/lsp/package.json');console.log('INSTALLED',m.name,m.version)"
echo P1_SWAP_DONE
