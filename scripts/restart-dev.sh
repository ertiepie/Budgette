#!/usr/bin/env sh
set -eu

PORT="${PORT:-5173}"
HOST="${HOST:-127.0.0.1}"

PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"

if [ -n "$PIDS" ]; then
  echo "Stopping existing server on port $PORT: $PIDS"
  kill $PIDS
  sleep 0.5
fi

echo "Starting Budgette at http://$HOST:$PORT/"
exec npm run dev -- --host "$HOST" --port "$PORT" --strictPort
