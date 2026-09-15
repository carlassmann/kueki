import { createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';

await rm('dist/kueki-local-ca.crt', { force: true });

// The Worker serves these documents; app-shell.txt and index.html are not fetchable as such,
// because it 404s the raw shell and redirects /index.html to /.
const OFFLINE_DOCUMENTS = ['/', '/app'];
const UNSERVED_FILES = new Set(['sw.js', '_headers', 'app-shell.txt', 'index.html']);

const files = Array.from(new Bun.Glob('**/*').scanSync('dist'))
  .filter((path) => !UNSERVED_FILES.has(path))
  .sort();
const isCode = (path: string) => path.endsWith('.js') || path.endsWith('.css');
const essential = [...OFFLINE_DOCUMENTS, ...files.filter(isCode).map((path) => `/${path}`)];
const optional = files.filter((path) => !isCode(path)).map((path) => `/${path}`);

const source = await Bun.file('public/sw.js').text();
const hash = createHash('sha256').update(source);
for (const path of files) hash.update(path).update(await Bun.file(`dist/${path}`).bytes());
const version = hash.digest('hex').slice(0, 12);

await Bun.write(
  'dist/sw.js',
  source
    .replace("'kueki-shell-v1'", `'kueki-shell-${version}'`)
    .replace(
      /const ESSENTIAL_ASSETS = \[[\s\S]*?\];/,
      `const ESSENTIAL_ASSETS = ${JSON.stringify(essential)};`,
    )
    .replace(
      /const OPTIONAL_ASSETS = \[[\s\S]*?\];/,
      `const OPTIONAL_ASSETS = ${JSON.stringify(optional)};`,
    ),
);
