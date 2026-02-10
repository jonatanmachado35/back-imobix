# 📚 Documentação de Desenvolvimento - Imobix

Documentos técnicos para desenvolvedores trabalhando no projeto Imobix.

---

## 📑 Índice de Documentos

### 🆕 Sistema de Registro Dual (9 de fevereiro de 2026)

#### 1. [Registro Dual de Usuários](./registro-dual-usuarios.md)
**Propósito**: Documentação completa da implementação  
**Conteúdo**:
- Arquitetura dos endpoints `POST /users` e `POST /auth/register`
- Componentes criados (RolesGuard, @Roles decorator)
- Fluxos de uso (público vs admin)
- Casos de uso práticos

**Quando consultar**: Entender a arquitetura geral do sistema de registro

---

#### 2. [Guia de Testes](./guia-testes-registro.md)
**Propósito**: Como criar e ajustar testes E2E  
**Conteúdo**:
- Setup completo do ambiente de teste
- Cenários de teste para ambos os endpoints
- Exemplos de código comentados
- Checklist de cobertura

**Quando consultar**: Criar novos testes ou debugar testes existentes

---

#### 3. [Troubleshooting](./troubleshooting-registro.md)
**Propósito**: Resolver problemas conhecidos  
**Conteúdo**:
- Problemas encontrados e soluções
- Comandos de debug (SQL, cURL, JWT decode)
- Como investigar falhas de autenticação
- Checklist de validação

**Quando consultar**: Testes falhando ou comportamento inesperado

---

## 🎯 Quick Start

### Para Entender o Sistema
1. Leia [registro-dual-usuarios.md](./registro-dual-usuarios.md)
2. Veja exemplos de uso na seção "Casos de Uso na Prática"

### Para Criar Testes
1. Leia [guia-testes-registro.md](./guia-testes-registro.md)
2. Use os templates de código fornecidos
3. Consulte o checklist ao final

### Para Resolver Problemas
1. Leia [troubleshooting-registro.md](./troubleshooting-registro.md)
2. Use os comandos de debug fornecidos
3. Siga o passo a passo de investigação

---

## 🔍 Busca Rápida

### Procurando...

**Como proteger endpoint com role?**  
→ [registro-dual-usuarios.md](./registro-dual-usuarios.md#componentes-detalhados) - RolesGuard

**Como testar endpoint admin-only?**  
→ [guia-testes-registro.md](./guia-testes-registro.md#testes-de-post-authregister)

**Teste retornando 401 em vez de 403?**  
→ [troubleshooting-registro.md](./troubleshooting-registro.md#4-teste-esperando-403-mas-recebendo-401)

**userRole não sendo salvo?**  
→ [troubleshooting-registro.md](./troubleshooting-registro.md#1-userrole-não-sendo-salvo-no-banco)

**Como decodificar JWT?**  
→ [troubleshooting-registro.md](./troubleshooting-registro.md#3-decodificar-jwt)

**Import do supertest dá erro?**  
→ [guia-testes-registro.md](./guia-testes-registro.md#1-import-do-supertest)

---

## 📊 Status da Implementação

| Componente | Status | Cobertura | Notas |
|------------|--------|-----------|-------|
| RolesGuard | ✅ Implementado | - | Funcional |
| @Roles decorator | ✅ Implementado | - | Funcional |
| POST /users | ✅ Implementado | 100% | Testes passando |
| POST /auth/register | ⚠️ Implementado | 0% | Testes falhando (JWT issue) |
| CreateUserDto | ✅ Implementado | - | Com userRole |
| RegisterDto | ⚠️ Inconsistente | - | Usar `name` (inglês) vs `nome` (português) |
| PrismaUserRepository | ✅ Corrigido | - | Salva userRole corretamente |

### Próximas Ações
- [ ] Corrigir testes de `/auth/register` (JWT com role)
- [ ] Padronizar DTOs (português vs inglês)
- [ ] Adicionar testes unitários de RolesGuard
- [ ] Documentar APIs no Swagger

---

## 🛠️ Comandos Úteis

```bash
# Rodar todos os testes E2E
npm run test:e2e

# Rodar teste específico
npx jest test/user-registration-flow.e2e-spec.ts

# Ver coverage
npm run test:cov

# Aplicar migrations
npm run prisma:migrate:deploy

# Abrir Prisma Studio (visualizar dados)
npx prisma studio
```

---

## 📝 Convenções

### Nomenclatura
- **Domínio**: Português (`nome`, `corretor`, `anúncio`)
- **Técnico**: Inglês (`repository`, `useCase`, `controller`)
- **DTOs**: **Inconsistente atualmente** (em processo de padronização)

### Estrutura de Arquivos
```
docs-dev/
├── README.md                      ← Você está aqui
├── registro-dual-usuarios.md      ← Documentação técnica
├── guia-testes-registro.md        ← Guia de testes
└── troubleshooting-registro.md    ← Resolução de problemas
```

---

## 🤝 Como Contribuir com Documentação

1. **Para novos recursos**: Criar documento seguindo template de `registro-dual-usuarios.md`
2. **Para guias de teste**: Adicionar cenários em `guia-testes-registro.md`
3. **Para problemas novos**: Documentar em `troubleshooting-registro.md`
4. **Atualizar este README**: Adicionar links e status

---

## 📞 Contato

**Dúvidas sobre implementação?**  
→ Consulte os documentos acima primeiro

**Encontrou um bug?**  
→ Veja [troubleshooting-registro.md](./troubleshooting-registro.md)

**Precisa de novo recurso?**  
→ Documente casos de uso e requisitos

---

**Última atualização**: 9 de fevereiro de 2026
