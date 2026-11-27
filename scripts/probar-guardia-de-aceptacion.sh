#!/usr/bin/env bash
# Prueba la guardia de aceptación: cada caso crea una rama en un repositorio temporal y espera OK (0) o FALLA (1).
# Uso: scripts/probar-guardia-de-aceptacion.sh scripts/guardia-de-aceptacion.mjs
set -uo pipefail
G="$(realpath "$1")"; R="$(mktemp -d)"; cd "$R" || exit 2
git init -q -b main; git config user.email t@t; git config user.name t; git config commit.gpgsign false
mkdir -p apps/api/acceptance/support apps/api/src .github
echo 'export const x = 1;' > apps/api/acceptance/support/api.ts
printf "import { test } from 'vitest';\ntest.fails('T-01 · a', () => {});\n" > apps/api/acceptance/T-01.acceptance.ts
echo 'a' > apps/api/src/app.ts; echo 'on: push' > .github/ci.yml
git add -A; git commit -qm base
fallas=0
caso() { # nombre rama esperado cambio
  local nombre="$1" rama="$2" esperado="$3" cambio="$4"
  git switch -q main; git switch -q -c "$rama"; eval "$cambio"; git add -A; git commit -qm x --allow-empty
  BASE=main HEAD=HEAD RAMA="$rama" node "$G" >/dev/null 2>&1; rc=$?
  if [ "$rc" = "$esperado" ]; then echo "ok    $nombre"; else echo "MAL   $nombre (rc=$rc, esperado $esperado)"; fallas=$((fallas+1)); fi
}
caso "test/: prueba nueva con .fails"        test/T-02-a 0 "printf \"import { test } from 'vitest';\ntest.fails('T-02 · b', () => {});\n\" > apps/api/acceptance/T-02.acceptance.ts"
caso "test/: prueba nueva sin .fails"        test/T-02-b 1 "printf \"import { test } from 'vitest';\ntest('T-02 · b', () => {});\n\" > apps/api/acceptance/T-02.acceptance.ts"
caso "test/: toca código de la app"         test/T-02-c 1 "echo b > apps/api/src/app.ts"
caso "feature: solo quita .fails"            tech/T-01-a 0 "sed -i 's/test.fails(/test(/' apps/api/acceptance/T-01.acceptance.ts; echo b > apps/api/src/app.ts"
caso "feature: quita .fails y cambia algo"   tech/T-01-b 1 "sed -i 's/test.fails(.T-01 · a./test(\"T-01 · otra\"/' apps/api/acceptance/T-01.acceptance.ts"
caso "feature: agrega prueba de aceptación"  feature/HU-RES-001-a 1 "cp apps/api/acceptance/T-01.acceptance.ts apps/api/acceptance/T-03.acceptance.ts"
caso "feature: borra prueba de aceptación"   fix/BUG-1-a 1 "rm apps/api/acceptance/T-01.acceptance.ts"
caso "feature: toca el soporte"              tech/T-01-c 1 "echo 'export const x = 2;' > apps/api/acceptance/support/api.ts"
caso "feature: toca los workflows"           tech/T-01-d 1 "echo 'on: pull_request' > .github/ci.yml"
caso "ci/: cambia el soporte"                ci/a 0 "echo 'export const x = 2;' > apps/api/acceptance/support/api.ts"
caso "ci/: cambia una prueba"                ci/b 1 "sed -i 's/· a/· z/' apps/api/acceptance/T-01.acceptance.ts"
caso "docs/: cambia una prueba"              docs/a 1 "sed -i 's/· a/· z/' apps/api/acceptance/T-01.acceptance.ts"
caso "hotfix/: sin restricciones"            hotfix/BUG-2-a 0 "sed -i 's/· a/· z/' apps/api/acceptance/T-01.acceptance.ts"
echo "fallas: $fallas"; rm -rf "$R"; exit "$fallas"
