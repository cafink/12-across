#!/bin/sh
# Serves the site at http://localhost:8000 (set PORT to change it).
set -eu
cd "$(dirname "$0")"
PORT="${PORT:-8000}"
docker build -q -t 12-across-dev . > /dev/null
exec docker run --rm --init \
  --user "$(id -u):$(id -g)" \
  --publish "$PORT:8000" \
  --mount type=bind,src="$PWD",target=/app \
  12-across-dev node tools/serve.js
