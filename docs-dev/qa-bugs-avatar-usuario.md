# 🐛 Bug Report: Upload de Avatar de Usuário

**Data:** 13/02/2026  
**QA Engineer:** GitHub Copilot  
**Feature:** Upload de Avatar de Usuário  
**Status:** ⚠️ Aprovado com ressalvas - 2 bugs P2 encontrados  

---

## 📋 Resumo Executivo

A feature de upload de avatar foi **aprovada para produção**, mas existem 2 bugs **não-bloqueantes** (P2) que devem ser corrigidos no próximo sprint para manter qualidade de código e conformidade com padrões REST.

**Tempo estimado de correção:** ~30 minutos total

---

## 🐛 BUG-001: Tipo incorreto no UpdateUserData

**Severidade:** P2 (Minor)  
**Prioridade:** Média  
**Tempo estimado:** 5 minutos  
**Categoria:** Type Safety

### Descrição

O tipo `UpdateUserData` define `avatar?: string`, mas o `DeleteUserAvatarUseCase` passa `{ avatar: null }`, criando inconsistência de tipos TypeScript.

### Localização

**Arquivo:** `src/application/ports/user-repository.ts` (linha 15)

```typescript
export type UpdateUserData = {
  nome?: string;
  email?: string;
  phone?: string;
  avatar?: string;  // ❌ PROBLEMA: não aceita null explicitamente
};
```

### Impacto

- TypeScript não detecta erro de tipo quando `null` é passado
- Funciona em runtime (Prisma aceita null), mas compromete type safety
- Pode causar confusão para desenvolvedores futuros
- Inconsistente com comportamento esperado do DELETE

### Evidência

**Uso problemático:**
```typescript
// src/application/use-cases/user-avatar/delete-user-avatar.use-case.ts:33
await this.userRepository.update(userId, { avatar: null });
// ⚠️ TypeScript deveria reclamar, mas não reclama porque null !== undefined
```

### Correção Necessária

**Arquivo:** `src/application/ports/user-repository.ts`

```typescript
export type UpdateUserData = {
  nome?: string;
  email?: string;
  phone?: string;
  avatar?: string | null;  // ✅ CORREÇÃO: aceita null explicitamente
};
```

### Critérios de Aceitação

- [ ] Tipo `UpdateUserData` aceita `avatar?: string | null`
- [ ] TypeScript continua compilando sem erros
- [ ] Testes continuam passando (não precisa alterar testes)

---

## 🐛 BUG-002: HTTP Status code incorreto no DELETE

**Severidade:** P2 (Minor)  
**Prioridade:** Média  
**Tempo estimado:** 5 minutos  
**Categoria:** REST Compliance

### Descrição

O endpoint `DELETE /users/me/avatar` retorna status **200 (OK)**, mas deveria retornar **204 (No Content)** conforme especificação arquitetural e padrão REST.

### Localização

**Arquivo:** `src/interfaces/http/user-avatar.controller.ts` (linha 87)

```typescript
@Delete()
@ApiOperation({
  summary: 'Remove avatar do usuário',
  description: 'Deleta imagem do Cloudinary e limpa campo no banco',
})
@ApiResponse({ status: 200, description: 'Avatar removido' })  // ❌ Doc diz 200
async delete(@Request() req) {
  // ... código retorna 200 por padrão
}
```

### Impacto

- **Viola convenção REST:** DELETE sem corpo de resposta deve retornar 204
- **Inconsistente com especificação:** Doc original definia 204
- Cliente pode interpretar incorretamente (200 sugere que há corpo de resposta)
- Inconsistente com outros endpoints DELETE da API

### Evidência

**Especificação original:**
```typescript
// docs-dev/upload-avatar-usuario.md (linha 99)
@ApiResponse({ status: 204, description: 'Avatar removido' })
```

**Testes E2E também estão incorretos:**
```typescript
// test/user-avatar.e2e-spec.ts (linhas 160, 166, 176, 182)
.expect(200);  // ❌ Deveria ser .expect(204)
```

### Correção Necessária

**Arquivo 1:** `src/interfaces/http/user-avatar.controller.ts`

```typescript
import {
  Controller,
  Delete,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  HttpCode,  // ✅ ADICIONAR import
} from '@nestjs/common';

// ...

@Delete()
@HttpCode(204)  // ✅ ADICIONAR decorator
@ApiOperation({
  summary: 'Remove avatar do usuário',
  description: 'Deleta imagem do Cloudinary e limpa campo no banco',
})
@ApiResponse({ status: 204, description: 'Avatar removido' })  // ✅ CORRIGIR doc
@ApiResponse({ status: 401, description: 'Não autenticado' })
async delete(@Request() req) {
  try {
    await this.deleteAvatar.execute(req.user.userId);
    // Não retorna nada (void) - status 204 automático
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw new NotFoundException('User not found');
    }
    throw error;
  }
}
```

**Arquivo 2:** `test/user-avatar.e2e-spec.ts`

Substituir **TODAS as ocorrências** de `.expect(200)` por `.expect(204)` no bloco `describe('DELETE /users/me/avatar')`:

```typescript
// Linha ~160
it('should delete avatar', async () => {
  await request(app.getHttpServer())
    .delete('/users/me/avatar')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(204);  // ✅ CORRIGIR

  // Check user profile has no avatar
  const profile = await request(app.getHttpServer())
    .get('/users/me')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200);

  expect(profile.body.avatar).toBeNull();
});

// Linha ~173
it('should not fail if user does not have avatar', async () => {
  // Delete once
  await request(app.getHttpServer())
    .delete('/users/me/avatar')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(204);  // ✅ CORRIGIR

  // Delete again (should not fail)
  await request(app.getHttpServer())
    .delete('/users/me/avatar')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(204);  // ✅ CORRIGIR
});

// Linha ~183
it('should reject unauthenticated request', async () => {
  await request(app.getHttpServer())
    .delete('/users/me/avatar')
    .expect(401);  // ✅ ESTE JÁ ESTÁ CORRETO (401, não 204)
});
```

### Critérios de Aceitação

- [ ] Endpoint retorna status 204 (No Content)
- [ ] Swagger documenta status 204 corretamente
- [ ] Testes E2E passam com `.expect(204)`
- [ ] Resposta não tem corpo (void)

---

## 💡 Melhorias Recomendadas (Opcional - Sprint Futuro)

### IMPROVEMENT-001: Código duplicado - extractPublicIdFromUrl

**Severidade:** P3 (Code Quality)  
**Tempo estimado:** 15 minutos  

O método `extractPublicIdFromUrl` está duplicado em ambos use cases (30+ linhas idênticas). Considere extrair para helper compartilhado:

```typescript
// src/application/use-cases/user-avatar/cloudinary-url.helper.ts
export function extractPublicIdFromUrl(url: string): string {
  // ... método atual
}
```

**Benefício:** Facilita manutenção e evita inconsistências.

---

### IMPROVEMENT-002: Validação de tamanho de arquivo

**Severidade:** P2 (Security/UX)  
**Tempo estimado:** 10 minutos  

Adicionar validação de tamanho máximo para evitar uploads excessivos:

```typescript
// src/interfaces/http/user-avatar.controller.ts
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

if (file.size > MAX_AVATAR_SIZE) {
  throw new BadRequestException('Avatar must be less than 5MB');
}
```

**Benefício:** Previne abuso de storage/banda e melhora UX (erro mais rápido).

---

## ✅ Validação Pós-Correção

Após aplicar as correções, executar:

```bash
# 1. Verificar tipos TypeScript
npm run build

# 2. Rodar testes unitários
npm test -- user-avatar

# 3. Rodar testes E2E
npm run test:e2e -- user-avatar

# 4. Verificar coverage (deve manter ~92%)
npm run test:cov -- user-avatar
```

**Resultado esperado:**
- ✅ Compilação sem erros TypeScript
- ✅ Todos os 16 testes passam
- ✅ Coverage mantém >= 92%

---

## 📊 Métricas Atuais

**Antes das correções:**
- ✅ Testes: 16/16 passando (100%)
- ✅ Coverage: 92.45%
- ⚠️ Bugs P2: 2
- 💡 Melhorias sugeridas: 2

**Após correções esperadas:**
- ✅ Testes: 16/16 passando (100%)
- ✅ Coverage: 92.45% (mantido)
- ✅ Bugs P2: 0
- 💡 Melhorias sugeridas: 2 (backlog)

---

## 📎 Referências

- **Especificação:** `docs-dev/upload-avatar-usuario.md`
- **Testes E2E:** `test/user-avatar.e2e-spec.ts`
- **Use Cases:** `src/application/use-cases/user-avatar/`
- **Controller:** `src/interfaces/http/user-avatar.controller.ts`

---

## 🚦 Status da Feature

| Aspecto | Status | Observação |
|---------|--------|------------|
| Funcionalidade | ✅ PASS | Todos os critérios atendidos |
| Testes | ✅ PASS | 100% passando |
| Coverage | ✅ PASS | 92.45% (meta: 70%) |
| Type Safety | ⚠️ P2 | BUG-001 (não bloqueante) |
| REST Compliance | ⚠️ P2 | BUG-002 (não bloqueante) |
| **RELEASE** | ✅ **APROVADO** | Corrigir bugs em próximo sprint |

---

**Próximos passos:**
1. Desenvolvedor aplica correções do BUG-001 e BUG-002
2. Roda suite de testes completa
3. Commita com mensagem: `fix(avatar): corrige tipos e status HTTP do DELETE`
4. Feature pronta para deploy em produção

---

**Contato QA:** GitHub Copilot  
**Data do relatório:** 13/02/2026
