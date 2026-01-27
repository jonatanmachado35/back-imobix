#!/bin/bash

# Script para verificar e validar configuração do Supabase

echo "🔍 Verificando configuração do Supabase..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL não está definida${NC}"
    exit 1
else
    echo -e "${GREEN}✅ DATABASE_URL está definida${NC}"
fi

# Verificar se DIRECT_URL está definida
if [ -z "$DIRECT_URL" ]; then
    echo -e "${YELLOW}⚠️  DIRECT_URL não está definida (recomendado para migrations)${NC}"
else
    echo -e "${GREEN}✅ DIRECT_URL está definida${NC}"
fi

# Verificar se DATABASE_URL contém pgbouncer=true
if echo "$DATABASE_URL" | grep -q "pgbouncer=true"; then
    echo -e "${GREEN}✅ DATABASE_URL contém pgbouncer=true${NC}"
else
    echo -e "${RED}❌ DATABASE_URL não contém pgbouncer=true${NC}"
    echo -e "${YELLOW}   Adicione ?pgbouncer=true no final da URL${NC}"
fi

# Verificar porta do pooler
if echo "$DATABASE_URL" | grep -q ":6543"; then
    echo -e "${GREEN}✅ DATABASE_URL usa porta 6543 (pooler)${NC}"
else
    echo -e "${YELLOW}⚠️  DATABASE_URL não usa porta 6543 (pooler)${NC}"
fi

# Verificar porta direta
if [ ! -z "$DIRECT_URL" ] && echo "$DIRECT_URL" | grep -q ":5432"; then
    echo -e "${GREEN}✅ DIRECT_URL usa porta 5432 (conexão direta)${NC}"
elif [ ! -z "$DIRECT_URL" ]; then
    echo -e "${YELLOW}⚠️  DIRECT_URL não usa porta 5432${NC}"
fi

echo ""
echo "📝 Formato esperado:"
echo ""
echo "DATABASE_URL:"
echo "postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-XX-XX.pooler.supabase.com:6543/postgres?pgbouncer=true"
echo ""
echo "DIRECT_URL:"
echo "postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
echo ""

# Tentar conectar ao banco
echo "🔌 Testando conexão..."
npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 | head -1
