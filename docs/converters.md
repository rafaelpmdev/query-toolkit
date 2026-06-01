# 🔄 Converters & Integração Prisma/SQL

O módulo `converters` implementa o padrão de design **Visitor** para navegar pela estrutura lógica de operadores (`QueryParamsOperator`) e transformá-los no formato de destino desejado (objetos `where` do Prisma ou cláusulas de consulta SQL).

---

## 🏗️ O Padrão Visitor no Core

As classes de operadores lógicos de domínio (como `EqualsOperator`, `InOperator`, etc.) representam estruturas puras de negócio. A arquitetura de conversores utiliza o padrão **Visitor** para isolar as regras de infraestrutura (como renderizar SQL ou mapear chaves para Prisma) sem acoplar essa lógica de persistência nas regras de negócio dos operadores.

A biblioteca disponibiliza duas implementações principais de `OperatorVisitor<R>` sob o capô:
1. **`ClauseVisitor`**: Transforma operadores em cláusulas relacionais parametrizadas do `SqlBuilder` (`Clause[]`).
2. **`PrismaVisitor`**: Transforma operadores em objetos parciais compatíveis com a sintaxe nativa do Prisma ORM.

---

## ⚡ Conversores de Conveniência Especializados

Para simplificar a implementação na camada de infraestrutura/repositório da sua aplicação, o toolkit exporta conversores dedicados e fortemente tipados.

### 1. `QueryParamsPrismaConverter` (Integração Prisma ORM)
Este conversor transforma os operadores de domínio gerados no parsing diretamente em um objeto compatível com a propriedade `where` do Prisma Client.

#### 🧠 Algoritmo de Fusão Inteligente (Field Clause Merging)
Se você tiver múltiplos filtros aplicados sobre a mesma propriedade (por exemplo, na URL: `price=gt=10;price=lt=50`), um mapeamento simples substituiria a primeira propriedade pela segunda na serialização do objeto JS. O `QueryParamsPrismaConverter` possui uma lógica inteligente que **funde as condições de campos idênticos** em um único objeto estruturado.

```typescript
import { QueryParamsParse, QueryParamsPrismaConverter } from '@raicampos/query-toolkit';

// 1. Filtros recebidos: idade maior ou igual a 18 E menor ou igual a 60
const rawParams = {
  age: ['gte=18', 'lte=60'],
  status: '==ACTIVE'
};

const operators = new QueryParamsParse(rawParams).build();

// 2. Executa a conversão para Prisma
const prismaConverter = new QueryParamsPrismaConverter(operators);
const where = prismaConverter.build();

// Retorna um objeto Where aninhado do Prisma fundido com precisão:
// {
//   status: { equals: 'ACTIVE' },
//   age: { gte: 18, lte: 60 }
// }
```

### 2. `QueryParamsSqlConverter` (Integração SQL Puro / SqlBuilder)
Converte os operadores em uma lista de objetos `Clause` que podem ser fornecidos diretamente para o `SqlBuilder` montar queries relacionais seguras e parametrizadas de alta performance.

```typescript
import { QueryParamsParse, QueryParamsSqlConverter, SqlBuilder } from '@raicampos/uery-toolkit';

const rawParams = {
  name: '~=John',
  status: '==ACTIVE'
};

const operators = new QueryParamsParse(rawParams).build();

// 1. Converte operadores para Clauses do SqlBuilder
const sqlConverter = new QueryParamsSqlConverter(operators);
const clauses = sqlConverter.build();

// 2. Alimenta o SqlBuilder
const builder = SqlBuilder.from('users')
  .whereClauses(clauses);

const query = builder.build();
// Retorna:
// sql: "SELECT * FROM users WHERE (name ILIKE $1) AND (status = $2)"
// params: ['%John%', 'ACTIVE']
```

---

## 🚀 Exemplo Real de Uso em Repositório (Clean Architecture)

De acordo com os princípios de **Clean Architecture**, a camada de apresentação (Controllers) não deve conhecer detalhes de infraestrutura (como banco ou ORM). O pipeline ideal é receber os filtros neutros no controller e convertê-los no repositório.

### Repositório Prisma (`coffee-prisma.repository.ts`)
```typescript
import { PrismaClient } from '@prisma/client';
import { QueryParamsPrismaConverter } from '@raicampos/uery-toolkit';
import { CoffeeFilters } from '../domain/coffee-filters';

export class CoffeePrismaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(filters: CoffeeFilters) {
    // Converte os operadores lógicos neutros para infraestrutura Prisma
    const where = new QueryParamsPrismaConverter(filters).build();

    return this.prisma.coffee.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }
}
```

### Repositório SQL Nativo (`coffee-pg.repository.ts`)
```typescript
import { Client } from 'pg';
import { QueryParamsSqlConverter, SqlBuilder } from '@raicampos/uery-toolkit';
import { CoffeeFilters } from '../domain/coffee-filters';

export class CoffeePgRepository {
  constructor(private readonly db: Client) {}

  async list(filters: CoffeeFilters) {
    // 1. Converte operadores para Clauses
    const clauses = new QueryParamsSqlConverter(filters).build();

    // 2. Usa o SqlBuilder para montar a query de forma segura
    const { sql, params } = SqlBuilder.from('coffees')
      .whereClauses(clauses)
      .addOrder('asc', 'name')
      .build();

    const result = await this.db.query(sql, params);
    return result.rows;
  }
}
```

---

## 🛡️ Estratégia de Fail-Fast

Ambos os Visitors foram projetados para garantir segurança máxima em tempo de execução. Ao invés de ignorar silenciosamente operações inválidas ou não mapeadas (o que poderia resultar em queries mal formadas ou vazamento de dados), o sistema falha imediatamente:

* **Validação do Operador `Between`**: Lança erros detalhados se o valor fornecido ao operador `btw=` não contiver exatamente dois elementos válidos.
* **Operadores Incompatíveis no Prisma**: Se a estrutura contiver uma cláusula de array complexa (como `<@` ou `@>`) e for convertida pelo `QueryParamsPrismaConverter`, um erro descritivo será lançado detalhando que a operação não é suportada nativamente no motor do Prisma ORM. Isso previne falhas silenciosas na persistência.
