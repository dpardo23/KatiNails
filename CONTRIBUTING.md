# Cómo contribuir

1. Cada cambio nace de un issue: una historia, un ítem técnico o un bug.
2. La rama sale de `develop` y sigue el modelo `feature/HU-…`, `tech/T-…` o `fix/BUG-…`.
3. Los commits y el título del PR siguen Conventional Commits. Solo se admiten los pies `Refs:` y `BREAKING CHANGE:`.
4. Antes de abrir el PR, `pnpm run check` termina sin errores.
5. El PR se fusiona solo con `ci-ok` en verde y la revisión del titular.
