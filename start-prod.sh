#!/bin/sh
set -e

echo "Starting application..."

# Start the Node.js server in background
node dist/main.js &
SERVER_PID=$!

# Wait a bit for server to start binding to port
sleep 2

# Run migrations and seeds in background (non-blocking)
(
  echo "Running database migrations..."
  npx prisma migrate deploy
  echo "Running database seeds..."
  npx prisma db seed
  echo "Database setup complete!"
) &

# Wait for the server process
wait $SERVER_PID
