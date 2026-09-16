/** What the Worker serves, shared by the Worker itself and by the build scripts that
    generate and verify the service worker's precache list. */

/** Paths the Worker answers with the app shell instead of a file of that name. */
export const APP_ROUTES = new Set([
  '/app',
  '/app/activity',
  '/app/settings',
  '/app/create',
  '/app/join',
]);

/** Built files the Worker never serves under their own name: the raw shell is hidden from
    crawlers, /index.html redirects to /, and the rest are infrastructure. */
export const UNSERVED_FILES = new Set(['sw.js', '_headers', 'app-shell.txt', 'index.html']);

/** The documents the app can boot from offline, in place of the files behind them. */
export const OFFLINE_DOCUMENTS = ['/', '/app'];

/** Whether the Worker answers this path with a 200, given the files in dist. */
export function isServable(path: string, builtFiles: ReadonlySet<string>) {
  if (path === '/') return builtFiles.has('index.html');
  if (APP_ROUTES.has(path)) return builtFiles.has('app-shell.txt');
  const file = path.replace(/^\//, '');
  return builtFiles.has(file) && !UNSERVED_FILES.has(file);
}
