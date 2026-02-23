# ADR-001 — Cadastro de Funcionário não habilita Login

## Contexto
O endpoint de cadastro de funcionários permite registrar um funcionário, mas o usuário recém-cadastrado não consegue autenticar via login.

## Problema
Há uma quebra de integração entre o domínio **Funcionários** e o domínio **Autenticação**: o cadastro cria a entidade de funcionário, porém não cria (ou não associa) a entidade de usuário necessária para autenticação.

## Impacto
- Funcionários cadastrados não conseguem realizar login.
- Inconsistência entre dados de pessoas e dados de autenticação.

## Decisão
O fluxo de cadastro de funcionário deve:
1. **Criar o Usuário de autenticação** com credenciais válidas.
2. **Associar o Funcionário a esse Usuário** no mesmo fluxo.
3. Garantir **consistência** (sem registros parciais) caso uma das etapas falhe.

## Alternativas consideradas
- **Criar apenas Funcionário** e deixar o Usuário ser criado em outro momento.
  - Rejeitada: mantém o problema de login e aumenta o risco de dados órfãos.

## Critérios de aceite
- Após cadastrar um funcionário, o login deve funcionar com as credenciais fornecidas.
- O funcionário deve estar vinculado a um usuário válido.
- Em caso de falha em qualquer etapa, não deve haver criação parcial de dados.

## Governança
- **Obrigatório**: consistência entre domínio de Funcionários e domínio de Autenticação.
- **Proibido**: registrar funcionário sem vínculo de usuário válido.
