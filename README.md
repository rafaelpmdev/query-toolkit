# @raicampos/query-toolkit

A powerful TypeScript toolkit for building database queries. It provides tools for RSQL parsing, SQL building, and data mapping.

## Features

- **RSQL Parsing**: Convert query strings like `name===John&age=gte=18` into structured operator objects.
- **SQL Builder**: A fluent API for building SQL queries with automatic column mapping and validation.
- **Data Mappers**: Easily map between database entities and domain models.
- **Flexible Operators**: Support for comparison, logical, and array operators.
- **Type Safety**: Built with TypeScript for robust validation and IDE support.

## Installation

```bash
npm install @raicampos/query-toolkit
```

## 🛡️ Parameterized Queries (Recommended)

`@raicampos/query-toolkit` supports parameterized queries, which are crucial for preventing SQL injection.

```typescript
import { SqlBuilder, ClauseEquals, ClauseGreaterThan } from '@raicampos/query-toolkit';

const builder = new SqlBuilder('users');
builder.add(new ClauseEquals('status', 'active'));
builder.add(new ClauseGreaterThan('age', 18));

// Returns { sql: "SELECT * FROM users WHERE status = $1 AND age > $2", params: ['active', 18] }
const { sql, params } = builder.build();

// Use with your database driver (e.g., pg)
// await db.query(sql, params);
```

## Core Components

### 1. SQL Builder

Build complex SQL queries with a fluent interface.

```typescript
import { SqlBuilder } from '@raicampos/query-toolkit';

const builder = new SqlBuilder('SELECT * FROM users');

builder
  .whereEquals('status', 'active')
  .whereGreaterThan('age', 18)
  .addOrder('desc', 'created_at')
  .addLimit(10);

const sql = builder.build();
// SELECT * FROM users WHERE (status = 'active') AND (age > 18) ORDER BY created_at DESC LIMIT 10
```

### 2. RSQL Parsing

Parse RSQL parameters from URL query strings.

```typescript
import { QueryParamsParse } from '@raicampos/query-toolkit';

const params = {
  name: '==John',
  age: 'gte=18',
  status: 'in=ACTIVE,PENDING'
};

const parser = new QueryParamsParse(params);
const operators = parser.build(); // Record<string, QueryParamsOperator[]>
```

### 3. Mapper Builder

Map your database entities to clean domain models.

```typescript
import { MapperBuilder } from '@raicampos/query-toolkit';

const userMapper = {
  id: 'user_id',
  email: 'user_email',
  name: 'full_name'
};

const builder = new MapperBuilder(userMapper);
const model = builder.entityToModel({
  user_id: 1,
  user_email: 'john@example.com',
  full_name: 'John Doe'
});
```

### 4. Converters (Visitors)

Convert query parameter operators into target formats (like Prisma Where query object or SQL query Clauses) using specialized, type-safe converters that leverage the Visitor pattern under the hood.

```typescript
import { QueryParamsParse, QueryParamsPrismaConverter, QueryParamsSqlConverter } from '@raicampos/query-toolkit';

const params = {
  status: '==active',
  age: 'gt=18'
};

const operators = new QueryParamsParse(params).build();

// 1. Convert to a Prisma Where query object (merges field conditions automatically)
const prismaConverter = new QueryParamsPrismaConverter(operators);
const prismaWhere = prismaConverter.build();
// Returns: { status: { equals: 'active' }, age: { gt: 18 } }

// 2. Convert to SQL Builder Clauses (for database agnostic SQL building)
const sqlConverter = new QueryParamsSqlConverter(operators);
const clauses = sqlConverter.build(); // Record<string, Clause[]>
```

### 5. Pagination (Classic & Cursor)

Robust and dynamic pagination using both **Classic** (offset/limit) and **Cursor-based** (bidirectional, minified base64) strategies.

```typescript
import { CursorPage, ClassicPage } from '@raicampos/query-toolkit';

// A. Cursor Pagination (Highly performant for infinite scrolls & large datasets)
// The library natively decodes, encodes, and minimizes the cursors strictly to the requested columns.
const cursorPagination = new CursorPage(20, 'eyJ2Ijp7ImlkIjoyfSwiZCI6MSwibyI6eyJpZCI6MX19');

// ... Pass the pagination object down to the repository
const { data, hasNext, hasPrev, nextCursor, prevCursor } = CursorPage.processResult(
  rawData, 
  cursorPagination.limit, 
  cursorDirection, 
  orderBy, // base properties for sorting (e.g. { price: 'asc' })
  hasCurrentCursor,
  'id' // Configurable primaryKey (tie-breaker)
);

// B. Classic Pagination (Traditional Offset/Limit UI)
const classicPagination = new ClassicPage(20, 2); // limit=20, page=2
console.log(classicPagination.offset); // 20
```

## 🚀 Advanced Usage

### 1. Type-Safe Querying

Leverage TypeScript to ensure you only query valid fields from your entities.

```typescript
import { SqlBuilder, QueryableFields } from '@raicampos/query-toolkit';

interface User {
  id: number;
  name: string;
  email: string;
  metadata: { lastLogin: Date }; // Not queryable by default
}

// Autocomplete for 'name', 'email', 'id'
// Error for 'metadata' or 'invalid'
const builder = SqlBuilder.from<User>('users');
builder.whereEquals('name', 'John');
```

### 2. Configurable Safety Limits

Override default safety limits for complex queries.

```typescript
const builder = new SqlBuilder<User>('users', undefined, {
  maxWhereClauses: 50,    // Default: 20
  maxOrderByClauses: 10,  // Default: 5
  maxLimit: 1000,         // Default: 100
});
```

### 3. Standardized RSQL Parsing

Parse full RSQL strings easily with `RsqlStringParser`.

```typescript
import { RsqlStringParser, QueryParamsParse } from '@raicampos/query-toolkit';

const filter = "name==John;age=gt=18;status=in=ACTIVE,PENDING";
const parser = new RsqlStringParser(filter);
const rawParams = parser.parse(); 

const queryParams = new QueryParamsParse(rawParams).build();
```

### 4. Security Features

- **SQL Injection Protection**: Detects and blocks dangerous patterns (e.g., `; DROP TABLE`).
- **Smart Wildcards**: The `contains` (`~=`) operator automatically wraps values with `%` for true partial matching (`ILIKE '%value%'`).

## 👨‍🍳 Cookbook

### Prisma Integration (sem raw SQL)

Use `QueryParamsPrismaConverter` para gerar filtros compatíveis com o `where` do Prisma diretamente, sem escrever SQL:

```typescript
import {
  RsqlStringParser,
  QueryParamsParse,
  QueryParamsPrismaConverter,
} from '@raicampos/query-toolkit';

// URL: /users?filter=status==ACTIVE;age=gte=18;role=in=ADMIN,MANAGER
const rawParams = new RsqlStringParser(req.query.filter).parse();
const operators = new QueryParamsParse(rawParams).build();

// Converte para o formato nativo do Prisma
const where = new QueryParamsPrismaConverter(operators).build();
// {
//   status: { equals: 'ACTIVE' },
//   age:    { gte: 18 },
//   role:   { in: ['ADMIN', 'MANAGER'] },
// }

const users = await prisma.user.findMany({ where });
```

> **Quando usar `QueryParamsPrismaConverter` vs `SqlBuilder`?**
> - `QueryParamsPrismaConverter` → fluxo padrão com Prisma ORM, sem SQL escrito à mão, ideal para a maioria dos casos.
> - `SqlBuilder` → necessário quando você usa raw SQL (`$queryRaw`), precisa de JOINs, subqueries complexas ou banco não suportado pelo Prisma.

### Operadores suportados pelo `QueryParamsPrismaConverter`

| Operador RSQL | Sintaxe | Prisma gerado |
|---|---|---|
| Equals | `==ACTIVE` | `{ equals: 'ACTIVE' }` |
| Not Equals | `!=ACTIVE` | `{ not: 'ACTIVE' }` |
| Contains (case-insensitive) | `~=john` | `{ contains: 'john', mode: 'insensitive' }` |
| Greater Than | `gt=18` | `{ gt: 18 }` |
| Greater Than or Eq | `gte=18` | `{ gte: 18 }` |
| Less Than | `lt=100` | `{ lt: 100 }` |
| Less Than or Eq | `lte=100` | `{ lte: 100 }` |
| Between | `btw=20,60` | `{ gte: 20, lte: 60 }` |
| In | `in=A,B,C` | `{ in: ['A','B','C'] }` |
| Not In | `out=X,Y` | `{ notIn: ['X','Y'] }` |

### NestJS Integration (Pipe)

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { RsqlStringParser, QueryParamsParse, QueryParamsConverter } from '@raicampos/query-toolkit';

@Injectable()
export class RsqlPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      const raw = new RsqlStringParser(value).parse();
      const ops = new QueryParamsParse(raw).build();
      return new QueryParamsConverter(ops);
    }
    return value;
  }
}
```

## 📦 Subpath Exports

The package supports clean subpath exports:

- `@raicampos/query-toolkit/common` - Utilities like `parseRsqlValue` and SQL Injection detectors
- `@raicampos/query-toolkit/converters` - Visitors (`ClauseVisitor`, `PrismaVisitor`), `QueryParamsConverter`, `QueryParamsPrismaConverter`, and `QueryParamsSqlConverter`
- `@raicampos/query-toolkit/mappers` - `MapperBuilder` and data mapping
- `@raicampos/query-toolkit/query-operator` - Individual modular operator implementations (Equals, GreaterThan, etc.)
- `@raicampos/query-toolkit/rsql-parse` - `QueryParamsParse`, `RsqlStringParser`, and static `OperatorRegistry`
- `@raicampos/query-toolkit/sql-builder` - `SqlBuilder` and SQL clauses (`ClauseAnd`, `ClauseOr`, etc.)
- `@raicampos/query-toolkit/types` - Type definitions, `QueryableFields`, and `OperatorSymbol`

## 📄 License

MIT
