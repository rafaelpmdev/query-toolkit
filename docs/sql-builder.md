# 🏗️ SQL Builder & Cláusulas

O módulo `sql-builder` fornece uma API fluente e fortemente tipada para construir consultas SQL parametrizadas complexas com proteção nativa contra injeção de SQL.

---

## 🚀 Conceito Principal

A geração de consultas manuais concatenando strings é propensa a erros e vulnerabilidades. O `SqlBuilder` resolve isso decompondo as condições em objetos especializados chamados **Clauses** que implementam a interface `Clause`.

### 🛡️ Queries Parametrizadas (Recomendado)
Sempre utilize o método `build()` em produção para que placeholders indexados (estilo PostgreSQL: `$1`, `$2`) sejam gerados separadamente dos valores reais.

```typescript
import { SqlBuilder, ClauseEquals, ClauseGreaterThan } from '@raicampos/query-toolkit';

const builder = new SqlBuilder('users');
builder.add(new ClauseEquals('status', 'active'));
builder.add(new ClauseGreaterThan('age', 18));

const { sql, params } = builder.build();
// sql: "SELECT * FROM users WHERE status = $1 AND age > $2"
// params: ['active', 18]
```

---

## 🛠️ API Fluente

O `SqlBuilder` disponibiliza diversos métodos utilitários que facilitam a criação de cláusulas sem instanciar classes manualmente:

```typescript
import { SqlBuilder } from '@raicampos/query-toolkit';

const query = new SqlBuilder('SELECT id, name FROM employees')
  .whereEquals('department', 'Engineering')
  .whereGreaterThanOrEquals('salary', 5000)
  .addOrder('desc', 'created_at')
  .addLimit(20)
  .addOffset(0);

const sql = query.build();
// SELECT id, name FROM employees WHERE (department = 'Engineering') AND (salary >= 5000) ORDER BY created_at DESC LIMIT 20 OFFSET 0
```

---

## 🧩 Cláusulas Disponíveis

Todas as cláusulas herdam do contrato principal `Clause` e estão localizadas em `src/sql-builder/implementations/`.

### 1. Cláusulas de Comparação Individual
* **`ClauseEquals(field, value)`**: `field = $n`
* **`ClauseNotEquals(field, value)`**: `field != $n`
* **`ClauseGreaterThan(field, value)`**: `field > $n`
* **`ClauseGreaterThanOrEquals(field, value)`**: `field >= $n`
* **`ClauseLessThan(field, value)`**: `field < $n`
* **`ClauseLessThanOrEquals(field, value)`**: `field <= $n`
* **`ClauseLike(field, value)`**: `field LIKE $n`
* **`ClauseIlike(field, value)`**: `field ILIKE $n` (case-insensitive)
* **`ClauseNotIlike(field, value)`**: `field NOT ILIKE $n`
* **`ClauseContains(field, value)`**: Traduz-se para `field ILIKE '%value%'` para buscas parciais.
* **`ClauseBetween(field, [min, max])`**: `field BETWEEN $n AND $m`

### 2. Cláusulas de Coleções e Arrays (PostgreSQL)
* **`ClauseIn(field, Array)`**: `field IN ($1, $2, ...)`
* **`ClauseNotIn(field, Array)`**: `field NOT IN ($1, $2, ...)`
* **`ClauseArrayContains(field, Array)`**: `field @> $n` (contém elementos)
* **`ClauseArrayIsContainedBy(field, Array)`**: `field <@ $n` (está contido em)
* **`ClauseArrayOverlap(field, Array)`**: `field && $n` (possui interseção)

### 3. Cláusulas de Agrupamento Lógico
* **`ClauseAnd(...clauses)`**: Agrupa múltiplas cláusulas com o operador lógico `AND` envolvendo-as entre parênteses: `(clause1 AND clause2)`.
* **`ClauseOr(...clauses)`**: Agrupa cláusulas com `OR` envolvendo-as entre parênteses: `(clause1 OR clause2)`.
* **`ClauseEmpty`**: Um *Null Object* utilizado para condições opcionais desativadas que não geram expressões SQL nem consomem memória.

---

## 🔒 Segurança de Tipos (TypeScript)

Para evitar erros de ortografia em tempo de desenvolvimento, você pode passar a interface do seu modelo ao instanciar o `SqlBuilder`. Isso garante autocomplete e validação dos campos consultados:

```typescript
interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
}

// O TypeScript exigirá que o nome do campo seja exatamente 'id', 'title', 'price' ou 'stock'
const builder = SqlBuilder.from<Product>('products');

builder.whereEquals('title', 'Smartphone'); // OK
builder.whereLessThan('price', 500); // OK
builder.whereEquals('invalid_field', 'value'); // Erro de Compilação no TS!
```
