import { createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';
await rm('dist/kueki-local-ca.crt', { force: true });
const assets = Array.from(new Bun.Glob('**/*').scanSync('dist'))
  // The Worker serves app-shell.txt only through the app routes and 404s it directly,
  // so precaching it would fail the install and leave the app without a service worker.
  .filter((path) => path !== 'sw.js' && path !== '_headers' && path !== 'app-shell.txt')
  .sort()
  .map((path) => `/${path}`);
const source = await Bun.file('public/sw.js').text();
const hash = createHash('sha256').update(source);
for (const asset of assets) hash.update(asset).update(await Bun.file(`dist${asset}`).bytes());
const version = hash.digest('hex').slice(0, 12);
await Bun.write(
  'dist/sw.js',
  source
    .replace("'kueki-shell-v1'", `'kueki-shell-${version}'`)
    .replace(/const ASSETS = \[[\s\S]*?\];/, `const ASSETS = ${JSON.stringify(['/', ...assets])};`),
);
