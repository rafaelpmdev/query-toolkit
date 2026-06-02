# 🔍 RSQL Parsing & Operadores Extensíveis

O módulo `rsql-parse` é responsável por interpretar strings de busca no padrão RSQL oriundas de query parameters na URL e transformá-las em um mapa estruturado e fortemente tipado de operadores lógicos de domínio (`QueryParamsOperator`).

---

## 📖 Sintaxe RSQL Suportada

A tabela a seguir apresenta os operadores RSQL suportados nativamente pelo toolkit:

| Operador RSQL | Significado | Exemplo de Uso | Expressão Equivalente |
|:---:|---|---|---|
| `==` | Igualdade | `name==John` | `name = 'John'` |
| `!=` | Diferença | `status!=DELETED` | `status != 'DELETED'` |
| `~=` | Contém (Busca Parcial) | `title~=clean` | `title ILIKE '%clean%'` |
| `!~=` | Não Contém | `title!~=draft` | `title NOT ILIKE '%draft%'` |
| `gt=` | Maior Que | `age=gt=18` | `age > 18` |
| `gte=` | Maior ou Igual | `age=gte=18` | `age >= 18` |
| `lt=` | Menor Que | `price=lt=100` | `price < 100` |
| `lte=` | Menor ou Igual | `price=lte=100` | `price <= 100` |
| `btw=` | Entre (Faixa de valores) | `salary=btw=5000,8000` | `salary BETWEEN 5000 AND 8000` |
| `in=` | Contido em Lista | `role=in=ADMIN,USER` | `role IN ('ADMIN', 'USER')` |
| `out=` | Não contido em Lista | `role=out=GUEST` | `role NOT IN ('GUEST')` |
| `@>` | Contém Array (Postgres) | `tags=@>typescript,node` | `tags @> ARRAY['typescript', 'node']` |
| `<@` | Está Contido no Array | `tags=<@typescript,node` | `tags <@ ARRAY['typescript', 'node']` |
| `&&` | Sobreposição de Array | `tags=&&javascript,html` | `tags && ARRAY['javascript', 'html']` |

---

## 🛠️ O Pipeline de Parsing Moderno

O parsing de parâmetros RSQL é efetuado em duas etapas complementares e de responsabilidades estritamente separadas (**Single Responsibility Principle — SRP**):

```mermaid
graph LR
    URL[URL Query String] -->|1. RsqlStringParser| RawMap[Raw Params: Record string, string]
    RawMap -->|2. QueryParamsParse| OpMap[Operators Map: Record string, QueryParamsOperator[]]
```

### 1. Parsing Sintático com `RsqlStringParser`
O `RsqlStringParser` analisa a string bruta da URL de filtros dinâmicos de listagem (normalmente passados no parâmetro `filter` da query string), interpretando os delimitadores lógicos `;` (AND) e `,` (OR) e extraindo um dicionário de pares chave-valor.

```typescript
import { RsqlStringParser } from '@raicampos/query-toolkit';

// Exemplo de URL Query String: ?filter=status==ACTIVE;age=gt=18
const rawFilter = "status==ACTIVE;age=gt=18";
const parser = new RsqlStringParser(rawFilter);

const rawParams = parser.parse();
// Retorna um Record<string, string>:
// {
//   status: '==ACTIVE',
//   age: 'gt=18'
// }
```

### 2. Resolução Semântica com `QueryParamsParse`
O `QueryParamsParse<T>` processa o dicionário gerado pelo parser sintático, validando as chaves em relação aos campos queryáveis e usando o `OperatorRegistry` para mapear cada expressão em instâncias concretas de operadores lógicos de domínio.

Ele aceita um parâmetro de validação opcional (`shape`) para restringir e filtrar as chaves que podem ser consultadas, garantindo segurança na exposição de dados.

```typescript
import { QueryParamsParse } from '@raicampos/query-toolkit';

interface UserFilter {
  status: string;
  age: number;
  role: string;
}

// 1. Recebemos parâmetros estruturados ou extraídos de RsqlStringParser
const rawParams = {
  status: '==ACTIVE',
  age: 'gt=18',
  password: '==secret' // Chave que desejamos barrar
};

// 2. Definimos a forma permitida (shape) para consulta
const allowedShape = {
  status: true,
  age: true
} as const;

// 3. Executamos o parse estruturado
const parsed = new QueryParamsParse<UserFilter>(rawParams, allowedShape).build();
// Retorna um Record<string, QueryParamsOperator[]>:
// {
//   status: [ EqualsOperator { symbol: '==', value: 'ACTIVE' } ],
//   age: [ GreaterThanOperator { symbol: 'gt=', value: 18 } ]
// }
// Nota: A chave 'password' foi ignorada por não pertencer ao shape permitido!
```

---

## 🔌 Extensibilidade Dinâmica via `OperatorRegistry`

A biblioteca implementa o padrão **Factory** estático através do `OperatorRegistry`. Isso permite estender os operadores suportados na aplicação sem a necessidade de modificar o código interno do toolkit, respeitando estritamente o **Princípio Aberto-Fechado (OCP)**.

### Criando e Registrando um Operador Customizado

Para adicionar um novo operador (por exemplo, um operador que realiza busca fonética `soundsLike=`), você deve:

1. Estender a classe base `QueryParamsOperator`.
2. Registrar o símbolo e o resolvedor no `OperatorRegistry`.

```typescript
import { QueryParamsOperator, OperatorRegistry } from '@raicampos/query-toolkitt';

// 1. Definição do novo operador de domínio
export class SoundsLikeOperator extends QueryParamsOperator {
  constructor(field: string, rawValue: string) {
    super('soundsLike=', field, rawValue);
  }

  // Define como o operador é visitado
  public accept<R>(visitor: any): R {
    // Se você tiver um visitor customizado, chama o método dele
    return visitor.visitSoundsLike ? visitor.visitSoundsLike(this) : (null as any);
  }
}

// 2. Registro no OperatorRegistry em tempo de inicialização da aplicação
OperatorRegistry.register('soundsLike=', (field, rawValue) => {
  return new SoundsLikeOperator(field, rawValue);
});
```

A partir do momento em que é registrado, qualquer parser `QueryParamsParse` na aplicação resolverá automaticamente strings como `name=soundsLike=Jon` para instâncias da classe `SoundsLikeOperator`, de forma nativa e segura!
