# Documentação da Configuração da VPS - Imobix

## O que foi feito ✅

### 1. Infraestrutura Base
- [x] Sistema operacional atualizado (Debian Trixie)
- [x] Docker instalado (versão 29.2.1)
- [x] Docker Compose instalado (versão 5.0.2)
- [x] Firewall UFW configurado (portas 22, 80, 443 liberadas)

### 2. Projeto
- [x] Projeto clonado do GitHub (git@github.com:jonatanmachado35/back-imobix.git)
- [x] Localização: `/opt/back-imobix`
- [x] Dockerfile otimizado para Debian Bullseye (corrige problema de OpenSSL)
- [x] docker-compose.prod.yml configurado

### 3. Banco de Dados
- [x] PostgreSQL 16-alpine rodando em container Docker
- [x] Porta 5432 exposta para conexões externas
- [x] 8 migrations executadas com sucesso
- [x] Volume Docker persistindo os dados

### 4. Aplicação
- [x] Aplicação NestJS construída e rodando em container
- [x] Porta 3000 exposta
- [x] Variáveis de ambiente configuradas
- [x] Health check funcionando
- [x] Swagger disponível em /docs

### 5. Servidor Web
- [x] Nginx instalado
- [x] Proxy reverso configurado (porta 80 → 3000)
- [x] Servidor respondendo pelo IP público

### 6. Dados Iniciais
- [x] Seed executada
- [x] Usuário admin criado

---

## O que falta fazer 🔲

### 1. Segurança
- [ ] **Restringir acesso ao banco** - Currently exposto publicamente na porta 5432
- [ ] **Configurar SSL/HTTPS** - precisa de domínio
- [ ] **Alterar senhas padrão** - senhas atuais estão no código
- [ ] **Configurar Fail2ban** (opcional)

### 2. Configurações de Ambiente
- [ ] **Configurar Cloudinary** - credenciais placeholder
- [ ] **Revisar variáveis JWT** - gerar senhas mais seguras
- [ ] **Criar .env.local** ou segredo no repositório para produção

### 3. CI/CD
- [ ] **Configurar GitHub Actions** - para deploy automático
- [ ] **Configurar webhook** - para atualizar automaticamente

### 4. Backup
- [ ] **Script de backup automático** - do banco de dados
- [ ] **Restauração** - testar restaurar backup

### 5. Domínio
- [ ] **Comprar domínio** - quando bought
- [ ] **Configurar DNS** - apontar para VPS
- [ ] **SSL com Let's Encrypt** - automático com Certbot
- [ ] **Atualizar Nginx** - usar nome de domínio

### 6. Monitoria (Opcional)
- [ ] **Logs centralizados** - ELK ou similar
- [ ] **Métricas** - Prometheus + Grafana
- [ ] **Alertas** - para quando algo falhar

---

## Credenciais Atuais

### Banco de Dados
| Campo | Valor |
|-------|-------|
| Host | 187.77.51.193 |
| Port | 5432 |
| Database | imobix |
| Username | postgres |
| Password | Imobix2024SecureDB |

### Usuário Admin
| Campo | Valor |
|-------|-------|
| Email | admin@imobix.com |
| Senha | admin123 |
| Role | ADMIN |

### Variáveis de Ambiente (no docker-compose.prod.yml)
```
DATABASE_URL=postgresql://postgres:Imobix2024SecureDB@db:5432/imobix?schema=public
DIRECT_URL=postgresql://postgres:Imobix2024SecureDB@db:5432/imobix?schema=public
JWT_SECRET=Imobix2024@JWT@Secret@Key@Super@Secure
JWT_REFRESH_SECRET=Imobix2024@JWT@Refresh@Super@Secure@Key
```

### Acesso SSH
| Campo | Valor |
|-------|-------|
| Host | 187.77.51.193 |
| Porta | 22 |
| Usuário | root |
| Senha | ,yH9R3yx8fj@SPSY?lPT |

---

## Comandos Úteis

### Containers
```bash
# Ver status
docker ps

# Ver logs
docker logs back-imobix-app-1 -f
docker logs back-imobix-db-1 -f

# Reiniciar app
docker restart back-imobix-app-1

# Parar tudo
cd /opt/back-imobix && docker compose -f docker-compose.prod.yml down

# Iniciar tudo
cd /opt/back-imobix && docker compose -f docker-compose.prod.yml up -d
```

### Banco de Dados
```bash
# Acessar banco pelo container
cd /opt/back-imobix && docker compose -f docker-compose.prod.yml exec db psql -U postgres -d imobix

# Executar migrations
cd /opt/back-imobix && docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Ver tabelas
cd /opt/back-imobix && docker compose -f docker-compose.prod.yml exec db psql -U postgres -d imobix -c '\dt'
```

### Nginx
```bash
# Verificar config
nginx -t

# Reiniciar
systemctl restart nginx

# Ver status
systemctl status nginx
```

### Atualização do Projeto
```bash
cd /opt/back-imobix
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

### Backup do Banco
```bash
# Criar backup
cd /opt/back-imobix && docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres imobix > backup_$(date +%Y%m%d).sql

# Restaurar backup
cd /opt/back-imobix && docker compose -f docker-compose.prod.yml exec -T db psql -U postgres imobix < backup_20240221.sql
```

---

## Arquivos Importantes

| Arquivo | Localização |
|---------|-------------|
| Projeto | /opt/back-imobix |
| docker-compose.prod.yml | /opt/back-imobix/docker-compose.prod.yml |
| Dockerfile | /opt/back-imobix/Dockerfile |
| .env | /opt/back-imobix/.env (NÃO COMMITAR) |
| Nginx config | /etc/nginx/sites-available/imobix |

---

## URLs

| Serviço | URL |
|---------|-----|
| API | http://187.77.51.193 |
| Swagger | http://187.77.51.193/docs |
| PostgreSQL | 187.77.51.193:5432 |

---

## Problemas Conhecidos

1. **Banco exposto publicamente** - Precisa configurar firewall para restringir acesso
2. **Sem SSL** - HTTPS não funciona sem domínio
3. **Senhas no código** - Variáveis de ambiente precisam ser movidas para Secrets Manager

---

## Para Continuar

1. **Imediato**: Alterar senhas padrão (admin, banco, JWT)
2. **Curto prazo**: Configurar SSL quando tiver domínio
3. **Médio prazo**: Configurar CI/CD e backup automático
4. **Longo prazo**: Monitoria e alertas
