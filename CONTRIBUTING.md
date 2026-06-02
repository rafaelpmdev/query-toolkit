# 🤝 Contribuindo com o @raicampos/query-toolkit

Obrigado pelo seu interesse em contribuir! Este toolkit foi projetado para ser robusto, extensível e seguro. Para mantermos o alto nível de qualidade do código, pedimos que siga nossas diretrizes de arquitetura e qualidade.

## 🧠 Mentalidade e Princípios (Clean Architecture)

Ao propor uma mudança ou nova funcionalidade, lembre-se:
1. **Responsabilidade Única (SRP)**: Não misture regras de parseamento de URL com regras de geração SQL/Prisma.
2. **Independência de Frameworks**: A camada de domínio (ex: operadores RSQL) não deve conhecer detalhes de bibliotecas externas de banco de dados. Para isso usamos o padrão **Visitor**.
3. **Fail-Fast**: Valide argumentos cedo e lance erros explícitos imediatamente caso os limites de segurança ou tipagem sejam desrespeitados.
4. **Tipagem Estrita**: Evite `any`. Mantenha o sistema fortemente tipado para que o TypeScript guie o desenvolvedor no uso correto da ferramenta. Nunca utilize asserções de tipo forçadas/evasivas (ex: `as unknown as Type`), pois elas mascaram bugs e quebram a integridade dos contratos de classes e interfaces.

## 🧪 Test-Driven Development (TDD) e Cobertura

Somos obcecados por testabilidade. Nenhuma nova feature ou correção de bug deve ser enviada sem o respectivo teste unitário.

Se você está adicionando um novo operador lógico ou estendendo a funcionalidade do `SqlBuilder`:

1. **Crie os testes primeiro**: Pense nos cenários de sucesso, falha e segurança (edge cases).
2. **Prove o Padrão Visitor**: Se você adicionar um novo operador (ex: `SoundsLikeOperator`), você precisa garantir que tanto o `ClauseVisitor` (para SQL) quanto o `PrismaVisitor` o tratem corretamente. Adicione testes em ambas as suítes de conversores.
3. **Valide a Segurança (SQL Injection)**: Se o seu PR introduzir manipulações de string, adicione testes na suíte do `SqlInjectionDetector` para garantir que novas falhas não passarão despercebidas.

## 🛠️ Passo a Passo para Contribuir

1. **Fork o Repositório**: Faça o fork e clone localmente.
2. **Instale as dependências**: Rode `npm install` (ou `yarn` / `pnpm`).
3. **Crie sua Branch**: `git checkout -b feature/novo-operador-rsql`.
4. **Escreva seus Testes**: Adicione testes unitários utilizando Vitest/Jest nas pastas `*.test.ts`.
5. **Implemente a Lógica**: Desenvolva o código limpo, focado e fortemente tipado.
6. **Rode a Suíte de Testes e Lints**: 
   ```bash
   npm run test
   npm run lint
   npm run build
   ```
7. **Abra o Pull Request**: Forneça um título claro e descreva (no corpo do PR) o problema sendo resolvido e as justificativas técnicas arquiteturais por trás da sua abordagem.

## 💡 Regra do Escoteiro

Ao tocar em um arquivo para fazer sua alteração, verifique se há algo próximo que possa ser melhorado. Renomear uma variável confusa ou extrair uma função complexa para métodos menores é sempre muito bem-vindo!
