#!/bin/sh
set -e

echo "Running database seeds..."
npx prisma db seed

echo "Starting application..."
exec node dist/main.js

