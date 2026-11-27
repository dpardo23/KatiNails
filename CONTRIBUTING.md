# Cómo contribuir

1. Cada cambio nace de un issue: una historia, un ítem técnico o un bug.
2. La rama sale de `develop` y sigue el modelo `feature/HU-…`, `tech/T-…` o `fix/BUG-…`.
3. Cada historia o ítem técnico va en dos PR:
   - **`test/HU-…` o `test/T-…`:** solo las pruebas de aceptación (`apps/*/acceptance/*.acceptance.ts`), marcadas con `test.fails`. El CI comprueba que fallan contra la API real.
   - **`feature/HU-…` o `tech/T-…`:** la implementación, con TDD. En las pruebas de aceptación solo se permite quitar `.fails`. El CI rechaza cualquier otro cambio.
4. Los commits y el título del PR siguen Conventional Commits. Solo se admiten los pies `Refs:` y `BREAKING CHANGE:`.
5. Antes de abrir el PR, `pnpm run check` termina sin errores.
6. El PR se fusiona solo con `ci-ok` en verde y la revisión del titular.
