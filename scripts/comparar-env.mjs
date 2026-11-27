// .env.example y la sección [local] de infra/secretos.toml deben tener los mismos nombres.
import { readFileSync } from 'node:fs';
import { parse } from 'smol-toml';

const example = new Set(
  readFileSync('.env.example', 'utf8')
    .split('\n')
    .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1])
    .filter((name) => name !== undefined),
);
const local = new Set(Object.keys(parse(readFileSync('infra/secretos.toml', 'utf8')).local ?? {}));

const onlyExample = [...example].filter((name) => !local.has(name));
const onlyLocal = [...local].filter((name) => !example.has(name));
for (const name of onlyExample)
  console.error(`FALLA  ${name} está en .env.example y no en [local]`);
for (const name of onlyLocal) console.error(`FALLA  ${name} está en [local] y no en .env.example`);
if (onlyExample.length + onlyLocal.length > 0) process.exit(1);
console.log(`OK  ${example.size} variables iguales en .env.example e infra/secretos.toml`);
