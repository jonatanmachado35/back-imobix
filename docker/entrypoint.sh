#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  npx prisma migrate deploy
  npx prisma db seed
fi

exec "$@"
