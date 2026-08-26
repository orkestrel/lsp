#!/bin/sh
set -eu
# L6 repack: the lsp source moved (L6-A contract, L6-B client), so the probe
# consumer's tarball rebuilds and repacks. The tarball now lives under the lsp
# repository's own tmp/, replacing the scaffold-hosted copy from the P1 swap.
# Replaced-range record: /home/user/probe/package.json carries
# "@orkestrel/lsp": "file:../scaffold/tmp/tarballs/orkestrel-lsp-0.0.1.tgz"
# before this run; the registry still serves no published release.
cd /home/user/lsp
npm run build
mkdir -p /home/user/lsp/tmp/tarballs
npm pack --pack-destination /home/user/lsp/tmp/tarballs
cd /home/user/probe
npm install /home/user/lsp/tmp/tarballs/orkestrel-lsp-0.0.1.tgz
node -e "const m=require('/home/user/probe/node_modules/@orkestrel/lsp/package.json');console.log('INSTALLED',m.name,m.version)"
rm -f /home/user/scaffold/tmp/tarballs/orkestrel-lsp-0.0.1.tgz
rmdir /home/user/scaffold/tmp/tarballs 2>/dev/null || true
echo L6_REPACK_DONE
