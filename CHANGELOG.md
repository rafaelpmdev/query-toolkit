# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2026-06-09

### Fixed
- Valores booleanos planos (`S`, `N`, `T`, `F`) não eram convertidos para `true`/`false` quando usados sem prefixo de operador RSQL (ex: `?ativo=S`) — corrige issue [#8](https://github.com/Raicamposs/query-toolkit/issues/8)
- Adicionada função `normalizePlainBoolean` em `param-normalizer` para normalizar esses valores antes de repassá-los ao conversor de primitivos

## [1.1.4] - 2026-06-10

### Added
- Dual ESM/CJS build via tsup — consumers can use `import` or `require`
- Source maps included in `dist/` for improved debugging
- TypeScript declaration maps (`declarationMap`) for Go-to-Definition support
- `LICENSE` file (MIT)
- `sideEffects: false` for tree-shaking support

### Changed
- Build toolchain migrated from `tsc` to `tsup` for dual module output
- `exports` map updated: `import` conditions now point to `.mjs` files
- `module` field added pointing to ESM entry

## [1.1.3] - 2026-06-05

### Added
- Validation framework for `QueryParamsParse` with structured error reporting
- Custom operator support via `OperatorRegistry`

### Changed
- RSQL parser architecture modernized
- Converters refactored with visitor pattern

## [1.1.0] - 2026-06-01

### Added
- Initial public release
- SQL Builder with fluent API
- RSQL string parser
- Mapper Builder for entity-to-model mapping
- Prisma and SQL converters via visitor pattern
- Classic and cursor-based pagination
- SQL injection detection with configurable patterns
