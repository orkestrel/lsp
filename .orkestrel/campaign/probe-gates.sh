#!/bin/sh
set -eu
cd /home/user/probe
echo "== format:check"
npm run format:check
echo "== lint:check"
npm run lint:check
echo "== check"
npm run check
echo "== build"
npm run build
echo "== test"
npm test
echo P_GATES_GREEN
