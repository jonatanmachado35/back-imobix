# Feature: Upload de Avatar de Usuário

**Status:** 📋 Especificação  
**Data:** 13/02/2026  
**Arquiteto:** GitHub Copilot  
**Estimativa:** 4-6 horas

---

## Contexto Atual

### O que já existe
- ✅ Campo `avatar` no schema Prisma (`User.avatar: String?`)
- ✅ Entidade User suporta avatar (`src/domain/entities/user.ts`)
- ✅ Endpoint `PATCH /users/me` aceita avatar como **URL string**
- ✅ Infraestrutura Cloudinary configurada (usada nos anúncios)

### Limitação atual
```http
PATCH /users/me
Content-Type: application/json

{
  "avatar": "https://exemplo.com/foto.jpg"  ← usuário precisa hospedar externamente
}
```

O usuário não consegue fazer upload direto de arquivo.

---

## Proposta Arquitetural

### Decisão: Endpoints separados (seguir padrão anúncios)

```
POST   /users/me/avatar     → Upload de arquivo para Cloudinary
DELETE /users/me/avatar     → Remove avatar (deleta do Cloudinary + limpa DB)
PATCH  /users/me            → Mantém comportamento atual (backward compatible)
```

### Por que não endpoint híbrido?
- ❌ Quebraria padrão JSON atual do `PATCH /users/me`
- ❌ Complexidade desnecessária (FileInterceptor + DTO validation)
- ❌ Frontend forçado a sempre usar FormData
- ✅ **Separação de responsabilidades (SRP)**
- ✅ **Consistência com padrão estabelecido** (referência removida: escopo de anúncios encerrado)

---

## Estrutura de Implementação

### 1. Use Cases

#### `src/application/use-cases/user-avatar/upload-user-avatar.use-case.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { UserRepository } from '@application/ports/user-repository';
import { CloudinaryService } from '@infrastructure/file-storage/cloudinary/cloudinary.service';

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export interface UploadUserAvatarInput {
  userId: string;
  file: Express.Multer.File;
}

export interface UploadUserAvatarOutput {
  avatarUrl: string;
}

export class UploadUserAvatarUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(input: UploadUserAvatarInput): Promise<UploadUserAvatarOutput> {
    // 1. Verificar se usuário existe
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    // 2. Se já tem avatar, deletar o antigo do Cloudinary
    if (user.avatar) {
      await this.cloudinaryService.deleteByUrl(user.avatar);
    }

    // 3. Upload para Cloudinary (pasta "avatars")
    const uploadResult = await this.cloudinaryService.uploadImage(
      input.file.buffer,
      `avatars/${input.userId}`, // public_id único por usuário
    );

    // 4. Atualizar entidade e persistir
    const updatedUser = user.updateProfile({ avatar: uploadResult.url });
    await this.userRepository.save(updatedUser);

    return { avatarUrl: updatedUser.avatar! };
  }
}
```

**Testes:** `upload-user-avatar.use-case.spec.ts`
- [x] Deve fazer upload e retornar URL
- [x] Deve deletar avatar antigo antes de fazer novo upload
- [x] Deve lançar UserNotFoundError se usuário não existir
- [x] Deve usar public_id `avatars/{userId}` no Cloudinary

---

#### `src/application/use-cases/user-avatar/delete-user-avatar.use-case.ts`
```typescript
export class DeleteUserAvatarUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (!user.avatar) {
      return; // Nada a fazer
    }

    // 1. Deletar do Cloudinary
    await this.cloudinaryService.deleteByUrl(user.avatar);

    // 2. Limpar campo no banco
    const updatedUser = user.updateProfile({ avatar: null });
    await this.userRepository.save(updatedUser);
  }
}
```

**Testes:** `delete-user-avatar.use-case.spec.ts`
- [x] Deve deletar imagem do Cloudinary
- [x] Deve setar avatar como null no banco
- [x] Não deve falhar se usuário não tem avatar
- [x] Deve lançar erro se usuário não existir

---

### 2. Controller

#### `src/interfaces/http/user-avatar.controller.ts`
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { UploadUserAvatarUseCase, UserNotFoundError } from '@application/use-cases/user-avatar/upload-user-avatar.use-case';
import { DeleteUserAvatarUseCase } from '@application/use-cases/user-avatar/delete-user-avatar.use-case';

@ApiTags('Usuários - Avatar')
@Controller('users/me/avatar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserAvatarController {
  constructor(
    private readonly uploadAvatar: UploadUserAvatarUseCase,
    private readonly deleteAvatar: DeleteUserAvatarUseCase,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Upload de avatar do usuário',
    description: 'Envia imagem de perfil (JPG/PNG). Substitui avatar anterior se existir.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Avatar uploaded', schema: {
    properties: { avatarUrl: { type: 'string' } }
  }})
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou ausente' })
  @UseInterceptors(FileInterceptor('avatar'))
  async upload(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    // Validação de tipo (Cloudinary já valida, mas melhor falhar cedo)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG/PNG images allowed');
    }

    try {
      return await this.uploadAvatar.execute({
        userId: req.user.userId,
        file,
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  @Delete()
  @ApiOperation({ 
    summary: 'Remove avatar do usuário',
    description: 'Deleta imagem do Cloudinary e limpa campo no banco'
  })
  @ApiResponse({ status: 204, description: 'Avatar removido' })
  async delete(@Request() req) {
    try {
      await this.deleteAvatar.execute(req.user.userId);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
```

**Testamento E2E:** `test/user-avatar.e2e-spec.ts`
- [x] `POST /users/me/avatar` deve fazer upload e retornar URL
- [x] Deve substituir avatar antigo
- [x] Deve rejeitar arquivo não-imagem
- [x] Deve rejeitar requisição sem autenticação
- [x] `DELETE /users/me/avatar` deve remover avatar
- [x] DELETE em usuário sem avatar não deve falhar

---

### 3. Module & Dependency Injection

#### `src/users/users.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { UsersController } from '@interfaces/http/users.controller';
import { UserAvatarController } from '@interfaces/http/user-avatar.controller';
import { CreateUserUseCase } from '@application/use-cases/create-user.use-case';
import { GetUserProfileUseCase } from '@application/use-cases/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from '@application/use-cases/update-user-profile.use-case';
import { UploadUserAvatarUseCase } from '@application/use-cases/user-avatar/upload-user-avatar.use-case';
import { DeleteUserAvatarUseCase } from '@application/use-cases/user-avatar/delete-user-avatar.use-case';
import { USER_REPOSITORY } from './users.tokens';
import { PrismaUserRepository } from '@infrastructure/database/prisma-user.repository';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { CloudinaryModule } from '@infrastructure/file-storage/cloudinary/cloudinary.module';
import { BcryptModule } from '@infrastructure/crypto/bcrypt.module';

@Module({
  imports: [DatabaseModule, CloudinaryModule, BcryptModule],
  controllers: [UsersController, UserAvatarController], // ← adicionar novo controller
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: CreateUserUseCase,
      useFactory: (repo, hasher) => new CreateUserUseCase(repo, hasher),
      inject: [USER_REPOSITORY, 'HASHER'],
    },
    {
      provide: GetUserProfileUseCase,
      useFactory: (repo) => new GetUserProfileUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: UpdateUserProfileUseCase,
      useFactory: (repo) => new UpdateUserProfileUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    // ← Novos use cases
    {
      provide: UploadUserAvatarUseCase,
      useFactory: (repo, cloudinary) => new UploadUserAvatarUseCase(repo, cloudinary),
      inject: [USER_REPOSITORY, 'CloudinaryService'], // ← verificar token correto no CloudinaryModule
    },
    {
      provide: DeleteUserAvatarUseCase,
      useFactory: (repo, cloudinary) => new DeleteUserAvatarUseCase(repo, cloudinary),
      inject: [USER_REPOSITORY, 'CloudinaryService'],
    },
  ],
  exports: [CreateUserUseCase],
})
export class UsersModule {}
```

---

### 4. Infraestrutura (já existe, verificar compatibilidade)

#### `src/infrastructure/file-storage/cloudinary/cloudinary.service.ts`
**Verificar se já tem:**
- ✅ `uploadImage(buffer, publicId)` - já existe (usado nos anúncios)
- ✅ `deleteByUrl(url)` - já existe (usado nos anúncios)

**Se necessário, adicionar método auxiliar:**
```typescript
async deleteByPublicId(publicId: string): Promise<void> {
  await this.cloudinary.uploader.destroy(publicId);
}
```

---

## Checklist de Implementação

### Fase 1: Use Cases (TDD) ⏱️ 2h
- [ ] Criar diretório `src/application/use-cases/user-avatar/`
- [ ] Implementar `upload-user-avatar.use-case.ts` com testes
- [ ] Implementar `delete-user-avatar.use-case.ts` com testes
- [ ] Garantir 100% coverage nos use cases

### Fase 2: Controller (TDD) ⏱️ 1.5h
- [ ] Criar `src/interfaces/http/user-avatar.controller.ts`
- [ ] Adicionar validações de arquivo (mimetype, size)
- [ ] Mapear erros para HTTP exceptions
- [ ] Implementar testes E2E em `test/user-avatar.e2e-spec.ts`

### Fase 3: Integração ⏱️ 1h
- [ ] Atualizar `users.module.ts` com factory providers
- [ ] Verificar token do CloudinaryService no módulo
- [ ] Testar manualmente com Postman/Insomnia
- [ ] Validar docs do Swagger (`/docs`)

### Fase 4: Validação ⏱️ 0.5h
- [ ] Rodar `npm test` - garantir que não quebrou nada
- [ ] Rodar `npm run test:cov` - verificar coverage ≥70%
- [ ] Rodar `npm run test:e2e` - validar fluxo completo
- [ ] Testar upload real no ambiente de DEV

---

## Exemplos de Uso

### Upload de Avatar
```bash
curl -X POST http://localhost:3000/users/me/avatar \
  -H "Authorization: Bearer {token}" \
  -F "avatar=@foto-perfil.jpg"

# Response 201
{
  "avatarUrl": "https://res.cloudinary.com/.../avatars/user123.jpg"
}
```

### Deletar Avatar
```bash
curl -X DELETE http://localhost:3000/users/me/avatar \
  -H "Authorization: Bearer {token}"

# Response 204 (sem corpo)
```

### Atualizar Avatar via URL (mantém comportamento atual)
```bash
curl -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"avatar": "https://gravatar.com/avatar/123"}'
```

---

## Trade-offs da Solução

### ✅ Vantagens
- Mantém `PATCH /users/me` intocado (backward compatible)
- Segue padrão estabelecido (anúncios usam mesma estrutura)
- Separação clara de responsabilidades (SRP)
- Fácil de testar e documentar
- Reutiliza CloudinaryService existente

### ⚠️ Desvantagens
- Cliente precisa fazer 2 requisições se quiser atualizar perfil + avatar junto
  - Mitigação: raro fazer as duas coisas juntas
- Mais um controller/endpoint no codebase
  - Mitigação: baixo custo de manutenção

---

## Referências no Código Existente

- **Padrão similar:** (referência removida: escopo de anúncios encerrado)
- **Cloudinary Service:** [src/infrastructure/file-storage/cloudinary/cloudinary.service.ts](../src/infrastructure/file-storage/cloudinary/cloudinary.service.ts)
- **User Entity:** [src/domain/entities/user.ts](../src/domain/entities/user.ts)
- **User Repository:** [src/infrastructure/database/prisma-user.repository.ts](../src/infrastructure/database/prisma-user.repository.ts)
- **Testes E2E exemplo:** (referência removida: escopo de anúncios encerrado)

---

## Critérios de Aceitação

- ✅ Usuário autenticado consegue fazer upload de JPG/PNG
- ✅ Avatar é armazenado no Cloudinary (pasta `avatars/`)
- ✅ Upload substitui avatar anterior automaticamente
- ✅ DELETE remove imagem do Cloudinary e limpa banco
- ✅ Swagger documenta os novos endpoints corretamente
- ✅ Testes E2E cobrem fluxo completo
- ✅ Coverage geral mantém ≥70%
- ✅ Não quebra comportamento atual do `PATCH /users/me`
