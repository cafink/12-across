#!/bin/sh
# Runs the test suite in Docker.  Extra arguments go to `node --test`.
set -eu
cd "$(dirname "$0")"
docker build -q -t 12-across-dev . > /dev/null
exec docker run --rm --init \
  --user "$(id -u):$(id -g)" \
  --mount type=bind,src="$PWD",target=/app \
  12-across-dev node --test "$@"
