// Utilidades de las tareas de secretos. Reglas:
// - Un valor nunca se imprime ni se pasa como argumento (quedaría en `ps` y en el historial).
// - Los errores nombran la variable y la entrada, nunca el valor.
// - La bóveda se cierra al terminar (bw lock).
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'smol-toml';

export const ROOT = process.env.PROYECTO_RAIZ ?? process.cwd();
const FOLDER = 'Katinails';

export function fail(message) {
  console.error(`FALLA  ${message}`);
  process.exit(1);
}

/** Corre un comando sin shell. La entrada estándar puede llevar un valor secreto. */
export function run(command, args, { input, capture = true } = {}) {
  const result = spawnSync(command, args, {
    input,
    encoding: 'utf8',
    stdio: [input === undefined ? 'ignore' : 'pipe', capture ? 'pipe' : 'inherit', 'pipe'],
  });
  if (result.error) fail(`no se pudo ejecutar ${command}: ${result.error.message}`);
  return result;
}

/** Lee una sección del mapa infra/secretos.toml (por ejemplo "github.staging"). */
export function readSection(path) {
  const map = parse(readFileSync(join(ROOT, 'infra', 'secretos.toml'), 'utf8'));
  const section = path.split('.').reduce((node, key) => node?.[key], map);
  if (section === undefined || typeof section !== 'object')
    fail(`no existe la sección [${path}] en infra/secretos.toml`);
  return Object.entries(section).map(([name, source]) => {
    const separator = source.indexOf(':');
    if (separator === -1) fail(`origen inválido para ${name} en [${path}]`);
    return { name, kind: source.slice(0, separator), where: source.slice(separator + 1) };
  });
}

/** Acceso a la carpeta «Katinails» de Bitwarden. Exige BW_SESSION en esta terminal. */
export function openVault() {
  if (!process.env.BW_SESSION) {
    fail('la bóveda está cerrada. Corre: export BW_SESSION="$(bw unlock --raw)"');
  }
  run('bw', ['sync', '--quiet']);
  const folders = JSON.parse(run('bw', ['list', 'folders', '--search', FOLDER]).stdout || '[]');
  const folder = folders.find((item) => item.name === FOLDER);
  if (!folder)
    fail(
      `no existe la carpeta «${FOLDER}» en Bitwarden: créala y guarda ahí las entradas de infra/secretos.toml`,
    );
  const items = JSON.parse(run('bw', ['list', 'items', '--folderid', folder.id]).stdout || '[]');
  const byName = new Map(items.map((item) => [item.name, item]));
  return {
    /** Devuelve el valor del campo oculto `name` de la entrada `entry`, o undefined si falta. */
    field(entry, name) {
      return byName.get(entry)?.fields?.find((field) => field.name === name)?.value ?? undefined;
    },
    lock() {
      run('bw', ['lock']);
    },
  };
}

/** Obtiene los valores de una sección. Avisa lo que falta sin cortar el resto (regla 3). */
export function resolveSection(entries, vault, extra = {}) {
  const values = new Map();
  const missing = [];
  for (const { name, kind, where } of entries) {
    let value;
    if (kind === 'bitwarden') value = vault?.field(where, name);
    else if (kind === 'fijo') value = where;
    else if (kind in extra) value = extra[kind](where);
    else fail(`origen "${kind}" no admitido para ${name}`);
    if (value === undefined || value === '') missing.push(`${name} (${kind}:${where})`);
    else values.set(name, value);
  }
  for (const item of missing) console.warn(`AVISO  falta ${item}`);
  return values;
}
