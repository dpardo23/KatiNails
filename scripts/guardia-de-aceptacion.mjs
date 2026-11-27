// Guardia de las pruebas de aceptación. La corre el CI en cada PR.
// Uso: BASE=<sha> HEAD=<sha> RAMA=<rama del PR> node scripts/guardia-de-aceptacion.mjs
//
// Reglas por tipo de rama:
// - test/…            Solo toca pruebas de aceptación y su soporte. Toda prueba nueva va con `.fails`.
// - feature/, tech/, fix/
//                     No agrega, borra ni cambia pruebas de aceptación. Solo puede quitar `.fails`
//                     (`test.fails(` → `test(`). Tampoco toca el soporte, los workflows ni esta guardia.
// - ci/…              Puede cambiar el soporte, los workflows y esta guardia, no las pruebas.
// - hotfix/…, develop Sin restricciones: un hotfix urge y develop solo trae PR ya revisados.
// - el resto          No toca nada de aceptación.
import { execFileSync } from 'node:child_process';

const { BASE, HEAD, RAMA } = process.env;
if (!BASE || !HEAD || !RAMA) {
  console.error('FALLA: faltan BASE, HEAD o RAMA.');
  process.exit(2);
}

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// Se compara contra el punto donde la rama sale de la base, igual que el diff del PR.
const MERGE_BASE = git('merge-base', BASE, HEAD).trim();

const ACCEPTANCE_DIR = /^apps\/[^/]+\/acceptance\//;
const isAcceptanceTest = (path) => ACCEPTANCE_DIR.test(path) && path.endsWith('.acceptance.ts');
const isAcceptanceSupport = (path) => ACCEPTANCE_DIR.test(path) && !isAcceptanceTest(path);
const isPipeline = (path) =>
  path.startsWith('.github/') || path === 'scripts/guardia-de-aceptacion.mjs';
// `test.fails(` e `it.fails(` pasan a `test(` e `it(`.
const removeFailsMarker = (text) => text.replace(/\b(test|it)\.fails\(/g, '$1(');
// Una prueba nueva sin `.fails`: `test(`, `it(`, `test.only(`, `test.skip(`, etc.
const PLAIN_TEST = /^\+\s*(test|it)(\.(?!fails\()\w+)?\(/;

const changes = git('diff', '--name-status', '--no-renames', `${BASE}...${HEAD}`)
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [status, path] = line.split('\t');
    return { status: status ?? '', path: path ?? '' };
  });

const errors = [];
const kind = RAMA.split('/')[0];

if (RAMA === 'develop' || kind === 'hotfix') {
  const touched = changes.filter(({ path }) => ACCEPTANCE_DIR.test(path));
  if (touched.length > 0 && kind === 'hotfix') {
    console.log(`::warning::El hotfix cambia ${String(touched.length)} archivo(s) de aceptación.`);
  }
} else if (kind === 'test') {
  for (const { status, path } of changes) {
    if (!ACCEPTANCE_DIR.test(path)) {
      errors.push(`${path}: una rama test/ solo toca pruebas de aceptación y su soporte.`);
      continue;
    }
    if (status === 'D' || !isAcceptanceTest(path)) continue;
    const added = git('diff', '--unified=0', `${BASE}...${HEAD}`, '--', path)
      .split('\n')
      .filter((line) => PLAIN_TEST.test(line));
    for (const line of added) {
      errors.push(`${path}: prueba nueva sin \`.fails\`: ${line.slice(1).trim()}`);
    }
  }
} else if (['feature', 'tech', 'fix'].includes(kind)) {
  for (const { status, path } of changes) {
    if (isAcceptanceSupport(path) || isPipeline(path)) {
      errors.push(`${path}: se cambia en una rama ci/ o test/, no en la implementación.`);
    } else if (isAcceptanceTest(path)) {
      if (status !== 'M') {
        errors.push(`${path}: la implementación no agrega ni borra pruebas de aceptación.`);
        continue;
      }
      const before = removeFailsMarker(git('show', `${MERGE_BASE}:${path}`));
      const after = git('show', `${HEAD}:${path}`);
      if (before !== after) {
        errors.push(`${path}: el único cambio permitido es quitar \`.fails\`.`);
      }
    }
  }
} else {
  for (const { path } of changes) {
    if (isAcceptanceTest(path) || (kind !== 'ci' && isAcceptanceSupport(path))) {
      errors.push(`${path}: una rama ${kind}/ no toca las pruebas de aceptación.`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.log(`::error::${error}`);
  process.exit(1);
}
console.log(
  `OK: la rama ${RAMA} respeta las reglas de aceptación (${String(changes.length)} archivos).`,
);
