# 🔧 Guia de Deploy - Render + Supabase

## 📋 Checklist de Deploy

### 1️⃣ Supabase - Configuração do Banco de Dados

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings → Database**
3. Copie as credenciais:
   - **Connection String** (Transaction Pooler) → `DATABASE_URL`
   - **Connection String** (Direct) → `DIRECT_URL`

**Exemplo:**
```bash
# Pooler (para aplicação)
DATABASE_URL=postgresql://postgres.pqtqsikpyrqhjxhwhqnp:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct (para migrations)
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.pqtqsikpyrqhjxhwhqnp.supabase.co:5432/postgres
```

### 2️⃣ Render - Variáveis de Ambiente

No painel do Render, configure as seguintes variáveis:

```bash
DATABASE_URL=postgresql://postgres.SEU_PROJECT_REF:SUA_SENHA@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:SUA_SENHA@db.SEU_PROJECT_REF.supabase.co:5432/postgres
PORT=3000
BCRYPT_SALT_ROUNDS=10
JWT_SECRET=seu-jwt-secret-forte-aqui
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=seu-refresh-secret-forte-aqui
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
```

### 3️⃣ Executar Migrations

Após configurar as variáveis, execute:

```bash
npm run prisma:migrate:deploy
```

Ou no Render, adicione ao **Build Command**:
```bash
npm install && npm run build && npx prisma migrate deploy
```

### 4️⃣ Build Command no Render

```bash
npm install && npm run build && npx prisma generate && npx prisma migrate deploy
```

### 5️⃣ Start Command no Render

```bash
npm run start:prod
```

## 🚨 Troubleshooting

### Erro: "Can't reach database server"

**Causa:** Banco de dados Supabase pausado ou credenciais incorretas.

**Solução:**
1. Verifique se o projeto Supabase está **ativo** (não pausado)
2. Confirme que `?pgbouncer=true` está presente na `DATABASE_URL`
3. Use **Transaction Pooler** (porta 6543) para `DATABASE_URL`
4. Use **Direct Connection** (porta 5432) para `DIRECT_URL`

### Erro: "P1001"

**Causa:** Não consegue conectar ao banco.

**Solução:**
1. Aguarde 30 segundos e tente novamente (Supabase pode estar iniciando)
2. Verifique se as credenciais estão corretas
3. Confirme que não há espaços extras nas variáveis de ambiente

### Banco pausado (Free Tier)

Projetos gratuitos da Supabase pausam após 1 semana de inatividade.

**Solução:**
1. Acesse o Dashboard da Supabase
2. Clique em **Resume Project**
3. Aguarde alguns minutos
4. Redeploy no Render

## ✅ Verificação Final

Após o deploy, teste:

```bash
curl https://seu-app.onrender.com/docs
```

Deve retornar a documentação Swagger.

## 📚 Links Úteis

- [Supabase Database Settings](https://app.supabase.com/project/_/settings/database)
- [Render Dashboard](https://dashboard.render.com/)
- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
