# 🗺️ Documentação Técnica — @raicamposs/query-toolkit

Bem-vindo à documentação técnica oficial do `@raicamposs/query-toolkit`. Este repositório fornece uma biblioteca robusta, extensível e de alto desempenho projetada em TypeScript para simplificar o ecossistema de dados das suas aplicações.

A biblioteca resolve de maneira definitiva o tratamento de queries dinâmicas na Web, desde o parsing de parâmetros na URL (sintaxe **RSQL**) até a geração de cláusulas relacionais seguras e integração transparente com ORMs modernos (como o **Prisma ORM**).

---

## 🗺️ Guia de Documentação por Módulos

Para explorar cada parte em profundidade, navegue pelos guias técnicos abaixo:

### 1. 🏗️ [SQL Builder & Cláusulas](./sql-builder.md)
Aprenda a construir consultas relacionais complexas de forma fluente e fortemente tipada. Descubra as cláusulas relacionais parametrizadas padrão que oferecem proteção absoluta contra **SQL Injection**.

### 2. 🔍 [RSQL Parsing & Operadores](./rsql-parser.md)
Compreenda o parseamento de URL query strings usando o `RsqlStringParser` e a resolução estrita de tipos via `QueryParamsParse`. Descubra o `OperatorRegistry` estático que permite registrar novos operadores personalizados de forma flexível em conformidade com o OCP (*Open/Closed Principle*).

### 3. 🔄 [Converters & Integração Prisma/SQL](./converters.md)
Aprenda sobre a arquitetura de conversão baseada no padrão **Visitor**. Descubra as novas classes facilitadoras `QueryParamsPrismaConverter` (com fusão inteligente de condições) e `QueryParamsSqlConverter` (extração fluida de cláusulas relacionais).

### 4. 🗺️ [Mapper Builder & Desacoplamento](./mappers.md)
Veja como utilizar o `MapperBuilder` para efetuar conversões bidirecionais eficientes e limpas entre as representações públicas expostas nas suas rotas e as estruturas físicas do banco de dados.

### 5. 🛡️ [Segurança, Limites & Boas Práticas](./security.md)
Explore os detalhes de segurança nativos da biblioteca, incluindo o analisador estático redundante `SqlInjectionDetector` e as travas configuráveis contra ataques de exaustão de banco de dados (DoS).

---

## 🚀 Filosofia de Design e Arquitetura Clean

O design do `@raicamposs/query-toolkit` é firmemente ancorado nos conceitos de **Clean Architecture** e **Clean Code**:

* **Princípio da Responsabilidade Única (SRP)**: O parsing sintático da URL, a validação de formato e a geração SQL/ORM são operações completamente isoladas e modulares.
* **Tipagem Estrita**: Sem asserções dinâmicas obscuras. Tipagens fortes do TypeScript (`QueryableFields<T>`) guiam o desenvolvedor em tempo de escrita, oferecendo excelente suporte à IDE e autocomplete.
* **Fail-Fast (Falha Rápida)**: Se operadores incompatíveis, valores incorretos (ex: operador `btw=` com apenas um valor) ou limites de segurança configurados forem estourados, a biblioteca lança imediatamente exceções explícitas e controladas antes que a requisição de rede onere o banco.
