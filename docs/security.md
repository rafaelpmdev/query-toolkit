# 🛡️ Segurança, Limites & Boas Práticas

A segurança de dados é um pilar fundamental do `@raicamposs/query-toolkit`. A biblioteca implementa proteções ativas e passivas para blindar a camada de dados da sua aplicação contra ataques cibernéticos comuns (especialmente **SQL Injection**) e exaustão de recursos do servidor.

---

## 1. 🛡️ Prevenção contra SQL Injection (SQLi)

O toolkit combate injeções SQL através de duas camadas de defesa independentes:

### Camada A: Queries Parametrizadas (Defesa Ativa)
A forma mais segura de prevenir SQLi é **nunca** concatenar variáveis diretamente na instrução SQL. O `SqlBuilder` e a classe `ClauseVisitor` isolam completamente a instrução SQL dos valores reais usando placeholders indexados (`$1`, `$2`, ...).

O banco de dados compila o plano de execução da query antes de injetar os valores parametrizados, garantindo que qualquer input de usuário seja tratado estritamente como um dado primitivo e não como comandos executáveis.

```typescript
// SEGURO - Os parâmetros nunca se misturam com o comando executado
const { sql, params } = builder.build();
await db.query(sql, params);
```

### Camada B: Detector de Assinaturas Maliciosas (`SqlInjectionDetector`)
Como proteção de redundância, o toolkit possui um analisador estático integrado (`SqlInjectionDetector`) que inspeciona strings e valores sanitizando ou bloqueando strings suspeitas que contêm assinaturas conhecidas de ataques de injeção SQL, tais como:
* Union Selects: `UNION SELECT ...`
* Comentários SQL de encerramento: `--` ou `/*`
* Modificadores condicionais tautológicos: `' OR '1'='1`
* Comandos empilhados perigosos: `; DROP TABLE`, `; UPDATE`, `; DELETE`

Se alguma assinatura de risco for identificada, o detector bloqueia imediatamente o processamento, lançando uma exceção de segurança controlada e impedindo que a query chegue às camadas de banco de dados.

---

## 2. 🚦 Limites de Segurança e Exaustão de Recursos

Consultas dinâmicas excessivamente grandes podem derrubar bancos de dados de produção ou consumir toda a memória disponível na CPU do servidor (Denial of Service). 

Para evitar isso, o `SqlBuilder` possui limites de segurança pré-configurados que você pode ajustar conforme o perfil do seu ambiente:

```typescript
import { SqlBuilder } from '@raicamposs/query-toolkit';

const builder = new SqlBuilder('users', undefined, {
  maxWhereClauses: 30,    // Impede o envio de mais de 30 condições WHERE aninhadas
  maxOrderByClauses: 5,   // Limita ordenações a no máximo 5 colunas simultâneas
  maxLimit: 100,          // Impede queries sem paginação ou com LIMIT excessivamente alto (ex: LIMIT 50000)
});
```

Se a requisição de API estourar qualquer um desses limites, uma exceção explícita será gerada em tempo de execução (**Fail-Fast**).

---

## 💡 Melhores Práticas Recomendadas

1. **Sempre use `build()`**: Nunca utilize o método `.build()` cru em queries construídas com entradas diretas da URL em ambientes de produção. O método `.build()` concatena os valores e deve ser reservado para depuração local ou scripts internos confiáveis.
2. **Defina esquemas Zod nas suas APIs**: Valide os query parameters de entrada com Zod antes de passá-los para o parser do RSQL. Isso fornece uma camada adicional de validação sintática e restrição de tipos.
3. **Limite o tamanho de string na URL**: Configure os middlewares do seu servidor web (Fastify, Express, NestJS) para rejeitar payloads de URL excessivamente longos (acima de 2048 caracteres).
