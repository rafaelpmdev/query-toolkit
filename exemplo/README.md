# ☕ query-toolkit-example

> Projeto de demonstração oficial da biblioteca **[@raicampos/query-toolkit](https://github.com/raicampos/query-toolkit)**.

Servidor HTTP construído com **Fastify + Prisma + PostgreSQL (Docker)** que demonstra, na prática, todos os recursos principais da biblioteca: parse de filtros RSQL, construção de queries SQL dinâmicas com `SqlBuilder`, conversão de operadores com `QueryParamsPrismaConverter` / `QueryParamsSqlConverter` e mapeamento de entidades com `MapperBuilder`.

**Novo:** Demonstração de versatilidade dos novos conversores com dois backends diferentes:
- 🔵 **CoffeeRepositoryPrisma** - Integração com Prisma ORM usando `QueryParamsPrismaConverter`
- 🟢 **CoffeeRepositoryPg** - Integração com cliente PG puro (node-pg) usando `QueryParamsSqlConverter` e `SqlBuilder`

---

## Stack

| Tecnologia | Versão | Papel |
|---|---|---|
| Node.js | 20+ | Runtime |
| Fastify | 5 | Framework HTTP |
| Prisma | 7 | ORM moderno com `prisma.schema` |
| PostgreSQL | 16 | Banco de dados via Docker Compose |
| TypeScript | 5 (strict) | Linguagem |
| node-pg | 8 | Cliente PostgreSQL nativo |
| @raicampos/query-toolkit | 1.0.0 | Biblioteca principal |

---

## 🚀 Setup rápido

```bash
# 1. Certifique-se de que o Docker Desktop esteja rodando
# 2. Instale as dependências
npm install

# 3. Suba o contêiner do PostgreSQL
docker compose up -d

# 4. Execute a geração do Prisma Client v7
npx prisma generate

# 5. Execute as migrations do banco
npx prisma migrate dev

# 6. Popule o banco com dados de exemplo (Seed)
npm run db:seed

# 7. Inicie o servidor em modo desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.
A documentação interativa Swagger estará exposta em `http://localhost:3000/docs`.

---

## 📚 Documentação dos Repositórios

Este projeto demonstra a versatilidade do toolkit com dois backends diferentes desacoplados da lógica de apresentação por meio da arquitetura de repositórios:

### 🔵 Prisma ORM Repository
**Arquivo:** [src/coffee/repositories/coffee-prisma.repository.ts](src/coffee/repositories/coffee-prisma.repository.ts)

- **Método:** `list()` - `QueryParamsPrismaConverter` + Prisma ORM para filtros inteligentes e type-safe.

### 🟢 PG Puro Repository
**Arquivo:** [src/coffee/repositories/coffee-pg.repository.ts](src/coffee/repositories/coffee-pg.repository.ts)

- **Método:** `list()` - `QueryParamsSqlConverter` + `SqlBuilder` + node-pg (cliente nativo) para máxima performance.

### 📖 Comparação
Consulte a implementação dos repositórios para ver como os dados são isolados de forma limpa da lógica HTTP do `CoffeeController`.

---

## 📁 Estrutura do Projeto

```
query-toolkit-example/
├── prisma/
│   ├── schema.prisma      # Modelo Coffee
│   └── seed.ts            # 12 cafés de exemplo
├── src/
│   ├── server.ts          # Bootstrap Fastify
│   ├── database.ts        # Instância Prisma Client (singleton)
│   ├── coffee/
│   │   ├── coffee.mapper.ts   # MapperBuilder (entidade → domínio)
│   │   ├── coffee.routes.ts   # Rotas Fastify
│   │   └── coffee.service.ts  # Lógica SqlBuilder
│   ├── diagnostics/
│   │   └── diagnostics.routes.ts # Rotas de Diagnóstico (/decode)
│   └── pipes/
│       └── rsql.pipe.ts       # Helper parse RSQL
├── .env                   # DATABASE_URL
├── package.json
└── tsconfig.json
```

---

## 🛣️ Rotas da API

### `GET /coffees`

Listagem com suporte a ordenação, paginação e filtros RSQL flexíveis passados diretamente em cada campo mapeado da entidade.

**Query Params:**

| Param | Tipo | Descrição | Padrão |
|---|---|---|---|
| `name` | `string` | Filtro RSQL para nome (ex: `==Cerrado` ou `~=arabica`) | — |
| `origin` | `string` | Filtro RSQL para origem (ex: `==Brazil` ou `in=[Brazil,Colombia]`) | — |
| `roast` | `string` | Filtro RSQL para torra (ex: `==DARK` ou `out=[LIGHT]`) | — |
| `flavor` | `string` | Filtro RSQL para sabor (ex: `~=chocolate`) | — |
| `price` | `string` | Filtro RSQL para preço (ex: `btw=20,60` ou `lte=50`) | — |
| `available` | `string` | Filtro RSQL para disponibilidade (ex: `==true`) | — |
| `tags` | `string` | Filtro RSQL ou operadores nativos de array (ex: `has=chocolate`) | — |
| `sort` | `string` | Campo + direção de ordenação (ex: `price:asc`) | — |
| `limit` | `number` | Limite de registros (1–100) | `20` |
| `offset` | `number` | Deslocamento de paginação (Classic Pagination) | `0` |
| `cursor` | `string` | Cursor base64 (Cursor Pagination bidirecional) | — |

**Resposta (usando Cursor Pagination):**
```json
{
  "data": [...],
  "meta": {
    "limit": 20,
    "nextCursor": "eyJ2Ijp7ImlkIjoyfSwiZCI6MSwibyI6eyJpZCI6MX19",
    "prevCursor": "eyJ2Ijp7ImlkIjoyfSwiZCI6MCwibyI6eyJpZCI6MX19"
  }
}
```

---

### `GET /coffees/:id`

Retorna um café por ID. Utiliza `coffeeMapper.entityToModel()` para mapear os campos.

**Resposta:**
```json
{
  "data": {
    "id": 1,
    "name": "Bourbon Amarelo do Cerrado",
    "origin": "Brazil",
    "roast": "MEDIUM",
    "flavorNotes": "Chocolate, Caramelo, Nozes",
    "priceUSD": 32.9,
    "available": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

> **Nota:** Observe os campos renomeados pelo `MapperBuilder`: `flavor → flavorNotes` e `price → priceUSD`.

---

### `POST /coffees`

Cria um novo café. Body validado estruturalmente.

**Body:**
```json
{
  "name": "Arábica Sul de Minas",
  "origin": "Brazil",
  "roast": "MEDIUM",
  "flavor": "Nozes, Chocolate",
  "price": 29.9,
  "available": true
}
```

---

### `GET /decode`

Rota utilitária para fins de diagnóstico técnico da biblioteca. Ela recebe parâmetros de consulta dinâmicos e exibe em tempo real a estrutura de operadores lógicos do core do `@raicampos/query-toolkit` via `QueryParamsParse`.

**Query Params:**
Aceita propriedades dinâmicas chave-valor estruturadas de busca ou RSQL (ex: `origin===Brazil&price=btw=20,60`).

**Exemplo de requisição:**
```bash
curl "http://localhost:3000/decode?origin===Brazil&price=btw=20,60"
```

**Resposta:**
```json
{
  "origin": [
    {
      "symbol": "==",
      "value": "Brazil"
    }
  ],
  "price": [
    {
      "symbol": "btw=",
      "value": [20, 60]
    }
  ]
}
```

---

## 🔍 Operadores RSQL Suportados

| Operador | Sintaxe | Descrição | Exemplo |
|---|---|---|---|
| Equals | `==` | Igualdade exata | `roast==DARK` |
| Not Equals | `!=` | Diferença | `roast!=LIGHT` |
| Contains | `~=` | ILIKE com wildcards | `name~=gesha` |
| Not Contains | `!~=` | NOT ILIKE | `flavor!~=tabaco` |
| Greater Than | `gt=` | Maior que | `price=gt=50` |
| Greater Than or Eq | `gte=` | Maior ou igual | `price=gte=50` |
| Less Than | `lt=` | Menor que | `price=lt=30` |
| Less Than or Eq | `lte=` | Menor ou igual | `price=lte=30` |
| In | `in=` | Está na lista | `origin=in=Brazil,Colombia` |
| Not In | `out=` | Não está na lista | `roast=out=LIGHT,DARK` |
| Between | `btw=` | Entre dois valores | `price=btw=20,60` |
| AND | `;` | Combina filtros | `roast==DARK;price=lte=50` |

---

## 📡 Exemplos de `curl`

### Todos os cafés (padrão)
```bash
curl http://localhost:3000/coffees
```

### Cafés com torra DARK
```bash
curl "http://localhost:3000/coffees?roast===DARK"
```

### Cafés da Etiópia, ordenados por preço decrescente
```bash
curl "http://localhost:3000/coffees?origin===Ethiopia&sort=price:desc"
```

### Cafés DARK com preço até R$50, ordenados pelo mais barato
```bash
curl "http://localhost:3000/coffees?roast===DARK&price=lte=50&sort=price:asc"
```

### Cafés com "chocolate" no sabor
```bash
curl "http://localhost:3000/coffees?flavor=~=chocolate"
```

### Cafés do Brasil ou Colômbia (operador `in`)
```bash
curl "http://localhost:3000/coffees?origin=in=[Brazil,Colombia]"
```

### Cafés que NÃO são do Brasil nem da Colômbia (operador `out`)
```bash
curl "http://localhost:3000/coffees?origin=out=[Brazil,Colombia]"
```

### Cafés com preço entre R$30 e R$70 (operador `btw`)
```bash
curl "http://localhost:3000/coffees?price=btw=30,70&sort=price:asc"
```

### Cafés com torra que NÃO seja LIGHT nem MEDIUM (operador `out` com texto)
```bash
curl "http://localhost:3000/coffees?roast=out=[LIGHT,MEDIUM]"
```

### Paginação Clássica (Offset/Limit)
```bash
curl "http://localhost:3000/coffees?limit=3&offset=3"
```

### Paginação com Cursores (Alta Performance)
```bash
# O cursor é um base64 retornado pelo prevCursor ou nextCursor do endpoint
curl "http://localhost:3000/coffees?limit=3&cursor=eyJ2Ijp7ImlkIjoyfSwiZCI6MSwibyI6eyJpZCI6MX19"
```


### Cafés disponíveis com preço acima de R$100
```bash
curl "http://localhost:3000/coffees?available===true&price=gte=100"
```

### Busca por ID
```bash
curl http://localhost:3000/coffees/1
```

### Criar novo café com tags
```bash
curl -X POST http://localhost:3000/coffees \
  -H "Content-Type: application/json" \
  -d '{"name":"Gesha Geisha","origin":"Ethiopia","roast":"LIGHT","flavor":"Jasmim, pêssego","price":120.0,"tags":["especial","floral","importado"]}'
```

### 🔍 Filtragem por Arrays do Postgres (Novidade)

Demonstra a biblioteca utilizando operadores nativos de array do PostgreSQL:

#### Cafés que contêm a tag `chocolate` (operador `has`)
```bash
curl "http://localhost:3000/coffees?tags=has=chocolate"
```

#### Cafés que possuem pelo menos uma das tags `brasil` ou `especial` (operador `hasAny`)
```bash
curl "http://localhost:3000/coffees?tags=hasAny=[brasil,especial]"
```

#### Cafés que possuem simultaneamente as tags `importado` e `floral` (operador `hasAll`)
```bash
curl "http://localhost:3000/coffees?tags=hasAll=[importado,floral]"
```

---

## 📚 Documentação Swagger (OpenAPI)

O projeto conta com documentação interativa via **Swagger/OpenAPI** disponível em `/docs`.

Acesse no navegador:
👉 **[http://localhost:3000/docs](http://localhost:3000/docs)**

Esta interface permite testar em tempo real:
- Validação Zod dos payloads de entrada (criação e listagem).
- Envio de filtros RSQL dinâmicos para a biblioteca.
- Visualização das respostas totalmente mapeadas e estruturadas.

---

## 🏗️ Como os recursos da biblioteca são usados

### 1. `RsqlStringParser` + `QueryParamsParse`

```typescript
// src/pipes/rsql.pipe.ts
import { RsqlStringParser, QueryParamsParse } from '@raicampos/query-toolkit/rsql-parse';

const rawParams = new RsqlStringParser("roast==DARK;price=lte=50").parse();
// { roast: "==DARK", price: "=lte=50" }

const operators = new QueryParamsParse(rawParams).build();
// { roast: [EqualsOperator], price: [LessThanOrEqualOperator] }
```

### 2. `QueryParamsPrismaConverter` & `QueryParamsSqlConverter`

```typescript
import { QueryParamsPrismaConverter, QueryParamsSqlConverter } from '@raicampos/query-toolkit/converters';

// Para o Prisma: gera o objeto where aninhado dinâmico
const prismaWhere = new QueryParamsPrismaConverter(operators).build();

// Para o SQL Nativo / SqlBuilder: gera um Record<string, Clause[]>
const sqlClauses = new QueryParamsSqlConverter(operators).build();
```

### 3. `SqlBuilder`

```typescript
// src/coffee/repositories/coffee-pg.repository.ts
import { SqlBuilder, QueryParamsSqlConverter } from '@raicampos/query-toolkitt';

// 1. Gera e junta todas as cláusulas lógicas em uma lista única
const converter = new QueryParamsSqlConverter(filters);
const clauses = Object.values(converter.build()).flat();

// 2. Alimenta o builder fluente
const builder = SqlBuilder.from<Coffee>('coffee')
  .whereClauses(clauses)
  .addLimit(20)
  .addOffset(0);

const { sql, params } = builder.build();
// sql: "SELECT * FROM coffee WHERE (roast = $1) AND (price <= $2) LIMIT 20"
// params: ["DARK", 50]
```

### 4. `MapperBuilder`

```typescript
// src/coffee/repositories/coffee-mapper.ts
import { MapperBuilder } from '@raicampos/query-toolkit/mappers';

export const coffeeMapping = {
  id: 'id',
  name: 'name',
  origin: 'origin',
  roast: 'roast',
  flavor: 'flavor',
  price: 'price',
  available: 'available',
  tags: 'tags',
  createdAt: 'createdAt',
} as const;

// Criado em conformidade com o encapsulamento de domínio (Interface Adapter)
const mapper = new MapperBuilder<PrismaCoffee, Coffee>(coffeeMapping)
  .convertDateToIso('createdAt');

const domainCoffee = mapper.modelToEntity(prismaCoffee);
```

---

## 🔗 Links

- 📦 **Repositório da biblioteca:** [github.com/raicampos/uery-toolkit](https://github.com/rraicampos/ery-toolkit)
- 📖 **npm package:** [@raicampos/query-toolkit](https://www.npmjs.com/package/@rraicampos/ery-toolkit)

---

## 🧪 Sugestões de Testes

Para testar a integração da biblioteca, considere:

- **Testes unitários** do `coffeeMapper.entityToModel()` verificando os campos renomeados
- **Testes unitários** do `parseRsqlFilter()` com diferentes strings RSQL
- **Testes de integração** das rotas com `fastify.inject()` para cada operador RSQL
- **Testes de limite** para verificar que `maxWhereClauses: 20` lança `RangeError` na 21ª cláusula
