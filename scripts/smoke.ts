/** Checks a deployed Kueki against the promises the app depends on: the service worker can
    install, the app shell is reachable, and the raw shell stays hidden from crawlers.
    Usage: bun scripts/smoke.ts https://kueki.app */
export {};

const base = (process.argv[2] || 'https://kueki.app').replace(/\/$/, '');
const failures: string[] = [];

async function statusOf(path: string) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' });
  return { status: response.status, body: response };
}

async function expectStatus(path: string, expected: number) {
  const { status } = await statusOf(path);
  if (status !== expected) failures.push(`${path} answered ${status}, expected ${expected}`);
}

const serviceWorker = await fetch(`${base}/sw.js`);
if (!serviceWorker.ok) {
  console.error(`${base}/sw.js answered ${serviceWorker.status}`);
  process.exit(1);
}
const source = await serviceWorker.text();
const lists = source.matchAll(/const (?:ESSENTIAL|OPTIONAL)_ASSETS = (\[[^\]]*\]);/g);
const precached = [...lists].flatMap(([, list]) => JSON.parse(list) as string[]);
if (precached.length === 0) failures.push('sw.js carries no precache list');

// One unservable path rejects the install and leaves the app with no service worker.
await Promise.all(precached.map((path) => expectStatus(path, 200)));

const shell = await fetch(`${base}/app`);
const shellHtml = await shell.text();
if (!shellHtml.includes('<div id="root"'))
  failures.push('/app did not return the app shell document');
await expectStatus('/app-shell.txt', 404);
await expectStatus('/index.html', 308);

if (failures.length) {
  console.error(`Smoke check failed against ${base}:`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`Smoke check passed against ${base}: ${precached.length} precached paths served.`);
