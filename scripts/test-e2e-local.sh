#!/bin/bash

set -euo pipefail

COMPOSE_FILE="docker-compose.test.yml"
DB_URL="postgresql://test_user:test_password@localhost:5433/imobix_test?schema=public"

cleanup() {
  echo "🧹 Finalizando banco de teste..."
  docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "🚀 Subindo banco de teste local..."
docker compose -f "$COMPOSE_FILE" up -d postgres-test

echo "⏳ Aguardando banco ficar saudável..."
for i in {1..30}; do
  if docker compose -f "$COMPOSE_FILE" exec -T postgres-test pg_isready -U test_user -d imobix_test >/dev/null 2>&1; then
    echo "✅ Banco pronto"
    break
  fi

  if [ "$i" -eq 30 ]; then
    echo "❌ Timeout aguardando banco de teste"
    exit 1
  fi

  sleep 1
done

echo "📦 Aplicando migrations no banco local de teste..."
DATABASE_URL="$DB_URL" DIRECT_URL="$DB_URL" npx prisma migrate deploy

echo "🧪 Executando testes E2E no banco local..."
DATABASE_URL="$DB_URL" DIRECT_URL="$DB_URL" npm run test:e2e -- --runInBand

echo "✅ Testes E2E locais concluídos"