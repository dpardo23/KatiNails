#!/usr/bin/env bash
# Revisa el entorno local. Responde OK, AVISO o FALLA. Nunca muestra valores.
set -uo pipefail

fallas=0
ok() { printf 'OK     %s\n' "$1"; }
aviso() { printf 'AVISO  %s\n' "$1"; }
falla() { printf 'FALLA  %s\n' "$1"; fallas=$((fallas + 1)); }

raiz="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$raiz" || exit 1

# 1. Entorno cargado y herramientas dentro del proyecto
if [ "${PROYECTO_RAIZ:-}" = "$raiz" ]; then ok "entorno cargado (.entorno)"; else falla "entorno sin cargar: source ./.entorno"; fi
case "${MISE_DATA_DIR:-}" in
  "$raiz"/*) ok "mise guarda todo en el proyecto" ;;
  *) falla "MISE_DATA_DIR fuera del proyecto" ;;
esac

# 2. Versiones de mise.toml instaladas
if mise ls --current --missing 2>/dev/null | grep -q .; then falla "faltan herramientas: mise install"; else ok "herramientas de mise.toml instaladas"; fi
for herramienta in node pnpm supabase java deno gitleaks; do
  ruta="$(command -v "$herramienta" 2>/dev/null || true)"
  case "$ruta" in
    "$raiz"/*) ok "$herramienta desde el proyecto" ;;
    "") falla "$herramienta no está instalado" ;;
    *) falla "$herramienta viene de fuera del proyecto ($ruta)" ;;
  esac
done

# 3. Git: identidad, hooks y archivos que no se suben
if [ -d .git ]; then
  correo="$(git config user.email || true)"
  case "$correo" in
    *@users.noreply.github.com) ok "correo de commits: noreply de GitHub" ;;
    *) falla "correo de commits distinto del noreply de GitHub" ;;
  esac
  if [ "$(git config core.hooksPath || true)" = ".githooks" ]; then ok "hooks activos"; else falla "hooks inactivos: git config core.hooksPath .githooks"; fi
  if [ -f .git/info/exclude ] && [ "$(grep -cvE '^(#|$)' .git/info/exclude)" -ge 4 ]; then ok "lista de exclusión local escrita"; else falla "falta la lista de exclusión local en .git/info/exclude"; fi
  if [ -n "$(git ls-files --cached --ignored --exclude-standard)" ]; then falla "hay archivos ignorados versionados"; else ok "ningún archivo ignorado versionado"; fi
else
  falla "no hay repositorio git: clona el proyecto con git clone"
fi

# 4. Archivos privados
if [ -f .env.local ]; then
  permisos="$(stat -c '%a' .env.local)"
  if [ "$permisos" = "600" ]; then ok ".env.local con permisos 600"; else falla ".env.local con permisos $permisos (deben ser 600)"; fi
else
  aviso ".env.local no existe todavía (mise run entorno:env)"
fi

# 5. Docker y puertos de Supabase local
if docker info >/dev/null 2>&1; then ok "Docker en marcha"; else aviso "Docker apagado (lo necesita supabase start)"; fi
ocupados="$(ss -ltnH 2>/dev/null | awk '{print $4}' | grep -cE ':5632[0-9]$' || true)"
expuestos="$(ss -ltnH 2>/dev/null | awk '{print $4}' | grep -E ':5632[0-9]$' | grep -vc '^127\.0\.0\.1:' || true)"
if [ "$expuestos" -gt 0 ]; then falla "Supabase local escucha fuera de 127.0.0.1 (usar mise run supabase:iniciar)"; else ok "puertos 5632x: $ocupados, todos en 127.0.0.1"; fi

echo
if [ "$fallas" -gt 0 ]; then echo "Resultado: $fallas FALLA"; exit 1; fi
echo "Resultado: sin FALLA"
