# Guia de Configuração da VPS - Imobix

## Visão Geral
- **Stack**: NestJS + PostgreSQL + Prisma
- **VPS**: Hostinger (Ubuntu 22.04)
- **Docker**: Sim
- **SSL**: Let's Encrypt

---

## 1. Primeiro Acesso à VPS

### Conectar via SSH
```bash
ssh root@SEU_IP_VPS
```

### Atualizar sistema
```bash
apt update && apt upgrade -y
```

---

## 2. Instalação do Docker

### Instalar dependências
```bash
apt install -y apt-transport-https ca-certificates curl software-properties-common
```

### Adicionar repositório Docker
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### Instalar Docker
```bash
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Verificar instalação
```bash
docker --version
docker-compose --version
```

---

## 3. Configuração de Segurança Inicial

### Criar usuário deploy
```bash
adduser deploy
usermod -aG docker deploy
```

### Configurar Firewall (UFW)
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Instalar Fail2ban (opcional mas recomendado)
```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## 4. Transferir Projeto para VPS

### Opção A: Git Clone (Recomendado)
```bash
# No seu computador, gere uma chave SSH e adicione ao GitHub
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Na VPS, adicione a chave pública no GitHub
# Depois clone o repositório
cd /opt
git clone https://github.com/SEU_USUARIO/SEU_REPO.git imobix
cd imobix
```

### Opção B: FTP/SFTP
Use FileZilla ou similar para fazer upload dos arquivos.

---

## 5. Configurar Variáveis de Ambiente

### Criar arquivo .env na VPS
```bash
cd /opt/imobix
nano .env
```

### Conteúdo do .env:
```env
# Banco de dados (use senhas fortes!)
DATABASE_URL="postgresql://postgres:SUA_SENHA_FORTE@db:5432/imobix?schema=public"
DIRECT_URL="postgresql://postgres:SUA_SENHA_FORTE@db:5432/imobix?schema=public"

# App
PORT=3000
NODE_ENV=production
BCRYPT_SALT_ROUNDS=10

# JWT (gere senhas aleatórias!)
JWT_SECRET=sua_chave_jwt_muito_segura_aqui
JWT_EXPIRES_IN=7d

# Cloudinary (se usar)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
```

### Alterar senhas do docker-compose.prod.yml
```bash
nano docker-compose.prod.yml
```

Mude as senhas padrão para senhas fortes:
```yaml
db:
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: SUA_SENHA_FORTE_AQUI
    POSTGRES_DB: imobix
```

E atualize a variável DATABASE_URL no serviço app para usar a mesma senha.

---

## 6. Configurar Docker Compose para Produção

### Criar arquivo production.env
```bash
nano production.env
```

```env
COMPOSE_PROJECT_NAME=imobix
COMPOSE_FILE=docker-compose.prod.yml
```

### Build e inicializar serviços
```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Iniciar serviços
docker-compose -f docker-compose.prod.yml up -d

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f app
```

---

## 7. Rodar Migrations e Seed

### Executar migrations
```bash
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

### Executar seed (se necessário)
```bash
docker-compose -f docker-compose.prod.yml exec app npx prisma db seed
```

### Verificar se o banco está funcionando
```bash
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d imobix -c "\dt"
```

---

## 8. Configurar Nginx como Proxy Reverso

### Instalar Nginx
```bash
apt install -y nginx
```

### Criar configuração do site
```bash
nano /etc/nginx/sites-available/imobix
```

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO_OU_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
```

### Ativar site
```bash
ln -s /etc/nginx/sites-available/imobix /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 9. Configurar SSL com Let's Encrypt

### Instalar Certbot
```bash
apt install -y certbot python3-certbot-nginx

# Se não encontrar o pacote, adicione o repositório:
snap install certbot --classic
```

### Obter certificado
```bash
certbot --nginx -d SEU_DOMINIO -d www.SEU_DOMINIO
```

### Configurar renovação automática
```bash
certbot renew --dry-run
```

Adicione ao crontab:
```bash
crontab -e
# Adicione esta linha:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 10. Comandos Úteis

### Reiniciar aplicação
```bash
cd /opt/imobix
docker-compose -f docker-compose.prod.yml restart app
```

### Ver logs
```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Apenas app
docker-compose -f docker-compose.prod.yml logs -f app

# Apenas banco
docker-compose -f docker-compose.prod.yml logs -f db
```

### Atualizar aplicação
```bash
cd /opt/imobix
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Backup do banco
```bash
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres imobix > backup_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres imobix < backup_20240101.sql
```

---

## 11. Pipeline CI/CD (Opcional)

Se quiser automatizar deploys via GitHub Actions, adicione o workflow abaixo:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: SSH into VPS and deploy
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/imobix
            git pull
            docker-compose -f docker-compose.prod.yml build
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

---

## Checklist de Verificação

- [ ] Acesso SSH funcionando
- [ ] Docker instalado e rodando
- [ ] Firewall configurado
- [ ] Projeto clonado na VPS
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados rodando
- [ ] Migrations executadas
- [ ] App rodando na porta 3000
- [ ] Nginx configurado como proxy
- [ ] SSL configurado (ou funcionando sem)
- [ ] Teste de health check (http://SEU_IP/health)

---

## Problemas Comuns

### Banco não conecta
- Verifique se as senhas no .env e docker-compose.prod.yml são iguais
- Verifique logs: `docker-compose logs db`

### App não inicia
- Verifique se as variáveis de ambiente estão corretas
- Verifique logs: `docker-compose logs app`

### Permissão negada
- Adicione seu usuário ao grupo docker: `usermod -aG docker seu_usuario`
- Ou use sudo

### Porta já em uso
- Verifique o que está usando a porta: `lsof -i :3000`
- Altere a porta no docker-compose.prod.yml se necessário
