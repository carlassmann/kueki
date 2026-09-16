/** Fails the build when the service worker precaches a path the Worker will not serve.
    An unservable path used to reject the whole install, leaving the app with no service
    worker at all, which costs offline reload and push notifications. */
import { isServable, OFFLINE_DOCUMENTS } from '../worker/routes';

const builtFiles = new Set(Array.from(new Bun.Glob('**/*').scanSync('dist')));
const serviceWorker = await Bun.file('dist/sw.js').text();

function precachedPaths() {
  const lists = serviceWorker.matchAll(/const (?:ESSENTIAL|OPTIONAL)_ASSETS = (\[[^\]]*\]);/g);
  return [...lists].flatMap(([, list]) => JSON.parse(list) as string[]);
}

const paths = precachedPaths();
if (paths.length === 0) throw new Error('No precache lists found in dist/sw.js');

const missingDocuments = OFFLINE_DOCUMENTS.filter((document) => !paths.includes(document));
if (missingDocuments.length)
  throw new Error(`Offline documents left out of the precache: ${missingDocuments.join(', ')}`);

const unservable = paths.filter((path) => !isServable(path, builtFiles));
if (unservable.length)
  throw new Error(`The Worker does not serve these precached paths: ${unservable.join(', ')}`);

console.log(`Precache verified: ${paths.length} paths the Worker serves.`);
