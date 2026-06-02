# 🗺️ Mapper Builder & Desacoplamento

O módulo `mappers` implementa o `MapperBuilder` para realizar conversões e mapeamentos de chaves bidirecionais de alta performance entre modelos de domínio (camada lógica ou representações públicas de APIs) e entidades físicas (camada de persistência/banco de dados).

---

## 🏗️ Princípios de Clean Architecture

De acordo com o princípio de **Independência de Persistência e Frameworks**, a sua lógica de negócio e os seus modelos de domínio não devem conhecer a estrutura exata de tabelas e colunas físicas do banco de dados. 

O `MapperBuilder` atua como um **Interface Adapter**, desacoplando as camadas de representação da camada de persistência. Ele permite expor chaves legíveis e seguras em camelCase na API, enquanto o banco trabalha em snake_case ou com terminologias legadas.

---

## 🛠️ Como Mapear Chaves

Você define um dicionário de mapeamento onde as chaves representam o **Modelo de Domínio** (público) e os valores apontam para as colunas da **Entidade Física** (banco de dados/infraestrutura).

```typescript
import { MapperBuilder } from '@raicampos/query-toolkit';

// Dicionário de mapeamento
const userMapping = {
  id: 'user_id',
  emailAddress: 'user_email',
  fullName: 'full_name',
  createdAt: 'created_at'
};

const userMapper = new MapperBuilder(userMapping);
```

### 1. Conversão do Banco de Dados para o Domínio (`entityToModel`)
Transforma registros vindos do banco de dados (infraestrutura) para a estrutura de domínio limpa:

```typescript
const dbRecord = {
  user_id: '123-abc',
  user_email: 'john@example.com',
  full_name: 'John Doe',
  created_at: new Date()
};

const domainUser = userMapper.entityToModel(dbRecord);
// Retorna:
// {
//   id: '123-abc',
//   emailAddress: 'john@example.com',
//   fullName: 'John Doe',
//   createdAt: <Date>
// }
```

### 2. Conversão do Domínio para o Banco de Dados (`modelToEntity`)
Transforma dados da camada de domínio para persistência nas colunas físicas do banco:

```typescript
const domainUser = {
  id: '123-abc',
  emailAddress: 'john@example.com',
  fullName: 'John Doe'
};

const dbPayload = userMapper.modelToEntity(domainUser);
// Retorna:
// {
//   user_id: '123-abc',
//   user_email: 'john@example.com',
//   full_name: 'John Doe'
// }
```

---

## ⚡ Integração Transparente com Listagem de Parâmetros e SQL Builder

Ao trabalhar com filtros dinâmicos recebidos na URL, você pode reaproveitar o mesmo mapeador de banco de dados para que os usuários façam consultas informando nomes de campos de domínio em vez das colunas físicas. 

O `SqlBuilder` aceita o mapeamento do `MapperBuilder` como segundo argumento no construtor. Ele traduzirá dinamicamente todas as cláusulas lógicas informadas na listagem:

```typescript
import { MapperBuilder, SqlBuilder, QueryParamsSqlConverter } from '@raicampos/uery-toolkit';

// 1. Definição do Mapeador de Domínio para Persistência
const mapping = {
  email: 'user_email',
  role: 'role_name'
};

const userMapper = new MapperBuilder(mapping);

// 2. Filtros parseados recebidos da API (com nomes públicos de domínio)
const rawParams = {
  email: '==john@example.com'
};
const operators = new QueryParamsParse(rawParams).build();
const clauses = new QueryParamsSqlConverter(operators).build();

// 3. Alimenta o SqlBuilder passando o dicionário de mapeamentos
const builder = SqlBuilder.from('users', userMapper.getMappings())
  .whereClauses(clauses);

const { sql, params } = builder.build();

// O SqlBuilder converte automaticamente o filtro no campo "email" para a coluna física de banco:
// sql: "SELECT * FROM users WHERE (user_email = $1)"
// params: ["john@example.com"]
```

Essa integração limpa garante que sua aplicação nunca exponha diretamente nomes de tabelas ou colunas físicas para o cliente, mitigando riscos de segurança e mantendo as responsabilidades arquiteturais muito bem definidas.
