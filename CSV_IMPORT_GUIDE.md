# Importação de Leads via CSV

## Visão Geral

O endpoint `/leads/import` permite a importação em massa de leads através do upload de um arquivo CSV.

## Formato do CSV

### Colunas Obrigatórias
- `nome` - Nome completo do lead
- `email` - Email do lead (único no sistema)

### Colunas Opcionais
- `telefone` - Telefone de contato
- `origem` - Origem do lead (ex: Website, Instagram, Indicação)
- `interesse` - Interesse do lead (ex: Apartamento, Casa)

### Formatos Aceitos
- Delimitador: vírgula (`,`) ou ponto-e-vírgula (`;`)
- Codificação: UTF-8
- Extensão: `.csv`

### Nomes Alternativos de Colunas

O sistema aceita os seguintes nomes alternativos para as colunas:

| Padrão PT | Alternativas |
|-----------|-------------|
| `nome` | `name` |
| `email` | `email` |
| `telefone` | `phone`, `telephone` |
| `origem` | `source`, `origin` |
| `interesse` | `interest` |

## Exemplo de CSV

```csv
nome,email,telefone,origem,interesse
João Silva,joao@example.com,11999999999,Website,Apartamento zona sul
Maria Santos,maria@example.com,11988888888,Instagram,Casa no litoral
Pedro Oliveira,pedro@example.com,11977777777,Indicação,Sala comercial
```

## Como Usar

### Via Swagger UI

1. Acesse `/docs` no navegador
2. Localize o endpoint `POST /leads/import`
3. Clique em "Try it out"
4. Faça upload do arquivo CSV
5. Execute a requisição

### Via cURL

```bash
curl -X 'POST' \
  'http://localhost:3000/leads/import' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer SEU_TOKEN_JWT' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@leads.csv'
```

### Via Postman

1. Método: `POST`
2. URL: `http://localhost:3000/leads/import`
3. Headers: 
   - `Authorization: Bearer SEU_TOKEN_JWT`
4. Body:
   - Tipo: `form-data`
   - Key: `file` (tipo File)
   - Value: Selecione seu arquivo CSV

## Resposta

### Sucesso (201 Created)

```json
{
  "totalProcessed": 100,
  "successCount": 95,
  "errorCount": 5,
  "errors": [
    {
      "row": 3,
      "data": {
        "nome": "João Silva",
        "email": "joao@example.com"
      },
      "error": "Email já cadastrado no sistema"
    },
    {
      "row": 15,
      "data": {
        "nome": "",
        "email": "invalido@example.com"
      },
      "error": "Nome é obrigatório"
    }
  ],
  "message": "Importação concluída: 95 leads cadastrados com sucesso, 5 erros encontrados."
}
```

### Erro (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Arquivo deve ser do tipo CSV",
  "error": "Bad Request"
}
```

## Regras de Validação

### Durante a Importação

1. **Email Duplicado**: Se o email já existir no banco de dados, o lead não será importado e um erro será registrado
2. **Nome Obrigatório**: Leads sem nome não serão importados
3. **Email Obrigatório**: Leads sem email não serão importados
4. **Email Válido**: O formato do email é validado
5. **Continuidade**: Erros em uma linha não interrompem o processamento das demais

### Status Inicial

- Todos os leads importados são criados com status `NOVO`
- A data de contato é definida como a data/hora da importação

## Tratamento de Erros

O sistema processa **todas as linhas** do CSV, mesmo quando encontra erros. 

### Tipos de Erro Comuns

| Erro | Descrição | Solução |
|------|-----------|---------|
| `Email já cadastrado no sistema` | Email duplicado no banco de dados | Use outro email ou atualize o lead existente |
| `Nome é obrigatório` | Campo nome vazio ou ausente | Preencha o campo nome |
| `Email é obrigatório` | Campo email vazio ou ausente | Preencha o campo email |
| `Invalid lead data: Valid email is required` | Formato de email inválido | Corrija o formato do email |

## Boas Práticas

1. **Validação Prévia**: Valide seu CSV antes de fazer o upload
2. **Backup**: Mantenha um backup do arquivo original
3. **Teste com Amostra**: Teste primeiro com um arquivo pequeno (5-10 linhas)
4. **Revise Erros**: Analise o array `errors` na resposta para corrigir problemas
5. **Encoding**: Use UTF-8 para evitar problemas com caracteres especiais
6. **Excel**: Se usar Excel, salve como "CSV UTF-8 (Delimitado por vírgulas)"

## Limitações

- Tamanho máximo do arquivo: Definido pela configuração do servidor (padrão NestJS)
- Formato aceito: Apenas `.csv`
- O sistema não atualiza leads existentes, apenas cria novos

## Arquitetura

A implementação segue Clean Architecture:

```
Controller (HTTP) 
    ↓
ImportLeadsFromCsvUseCase (Application Layer)
    ↓
LeadRepository (Port/Interface)
    ↓
PrismaLeadRepository (Infrastructure)
```

### Componentes

- **Use Case**: [import-leads-from-csv.use-case.ts](src/application/use-cases/import-leads-from-csv.use-case.ts)
- **Controller**: [leads.controller.ts](src/interfaces/http/leads.controller.ts)
- **DTOs**: [lead-response.dto.ts](src/interfaces/http/dto/lead-response.dto.ts)
- **Tests**: [import-leads-from-csv.use-case.spec.ts](src/application/use-cases/import-leads-from-csv.use-case.spec.ts)
