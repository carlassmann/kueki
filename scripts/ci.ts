/** Runs the full suite on this machine and signs off the tested commit, which is what a
    pull request needs before it can be merged. The browser suite needs Chromium, WebKit and
    three local servers, so running it here is cheaper and truer than running it hosted.
    The local run catches most failures fast; a deploy to the isolated preview Worker then proves
    the same promises hold on the real Cloudflare runtime before anything gets signed off. */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const TIMEOUT_MS = 15 * 60 * 1000;
const SIGNOFF_INSTALL = 'gh extension install basecamp/gh-signoff --pin v0.4.1';
const PREVIEW_ENVIRONMENT = 'preview';
const SERVICES = [
  { name: 'api', url: 'http://127.0.0.1:4311/' },
  { name: 'preview', url: 'http://127.0.0.1:4313/' },
  { name: 'https', url: 'https://127.0.0.1:4312/' },
];

let deadline = Date.now() + TIMEOUT_MS;

function capture(command: string[]) {
  const result = spawnSync(command[0], command.slice(1), { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr.trim() || `${command[0]} failed`);
  return result.stdout.trim();
}

function run(step: string, command: string[], env?: Record<string, string>) {
  process.stdout.write(`\n── ${step} ──\n\n`);
  const result = spawnSync(command[0], command.slice(1), {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    timeout: Math.max(deadline - Date.now(), 1),
  });
  if (result.status === 0) return;
  const timedOut = result.error && 'code' in result.error && result.error.code === 'ETIMEDOUT';
  throw new Error(timedOut ? 'Local CI ran out of time' : `${step} failed`);
}

function requireSignoffExtension() {
  const installed = spawnSync('gh', ['signoff', '--help'], { cwd: ROOT, stdio: 'ignore' });
  if (installed.status !== 0)
    throw new Error(`gh-signoff is required. Install it:\n${SIGNOFF_INSTALL}`);
}

function requireTestedState(testedSha: string) {
  const changes = capture(['git', 'status', '--porcelain=v1', '--untracked-files=all']);
  if (changes) throw new Error(`Commit or remove working-tree changes first:\n${changes}`);
  const head = capture(['git', 'rev-parse', 'HEAD']);
  if (head !== testedSha) throw new Error(`HEAD moved during CI: tested ${testedSha}, now ${head}`);
}

function startServices() {
  for (const { name } of SERVICES) run(`Start ${name}`, ['work', 'restart', name]);
}

async function waitForServices() {
  for (const { name, url } of SERVICES) {
    process.stdout.write(`\n── Wait for ${name} ──\n\n`);
    const until = Date.now() + 60_000;
    while (Date.now() < until) {
      const reachable = spawnSync('curl', ['-ksf', '-o', '/dev/null', url], { cwd: ROOT });
      if (reachable.status === 0) break;
      await Bun.sleep(1000);
      // Another branch's workspace holding the port is the usual cause; `work down -a` clears it.
      if (Date.now() >= until)
        throw new Error(
          `${name} never answered on ${url}. Stop other workspaces with: work down -a`,
        );
    }
    process.stdout.write(`ready: ${url}\n`);
  }
}

/** The preview Worker is a separate script, so its Durable Objects and rate limiter are its own
    and the suite can create rooms without touching what kueki.app serves. */
function deployPreviewWorker() {
  process.stdout.write(`\n── Deploy preview Worker ──\n\n`);
  const result = spawnSync('bunx', ['wrangler', 'deploy', '--env', PREVIEW_ENVIRONMENT], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: Math.max(deadline - Date.now(), 1),
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  process.stdout.write(output);
  if (result.status !== 0) throw new Error('Deploy preview Worker failed');
  const origin = output.match(/https:\/\/\S+\.workers\.dev/)?.[0];
  if (!origin) throw new Error('Deploy preview Worker printed no reachable URL');
  return origin;
}

// Uploaded assets reach the edge a few seconds after the deploy command returns.
async function waitForPreview(origin: string) {
  process.stdout.write(`\n── Wait for preview ──\n\n`);
  const until = Date.now() + 90_000;
  while (true) {
    const smoke = spawnSync('bun', ['scripts/smoke.ts', origin], { cwd: ROOT, encoding: 'utf8' });
    if (smoke.status === 0) return process.stdout.write(smoke.stdout);
    if (Date.now() >= until) {
      process.stderr.write(`${smoke.stdout || ''}${smoke.stderr || ''}`);
      throw new Error(`Preview never served every precached path: ${origin}`);
    }
    await Bun.sleep(3000);
  }
}

function reportFailure(testedSha: string) {
  const reported = spawnSync('gh', ['signoff', 'fail', '--commit', testedSha], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (reported.status !== 0) process.stderr.write(`\nPush ${testedSha} to report the failure.\n`);
}

async function main() {
  let testedSha: string | undefined;
  try {
    requireSignoffExtension();
    testedSha = capture(['git', 'rev-parse', 'HEAD']);
    requireTestedState(testedSha);
    deadline = Date.now() + TIMEOUT_MS;

    run('Install dependencies', ['bun', 'install', '--frozen-lockfile']);
    run('Push keys', ['bun', 'run', 'setup']);
    run('Certificate authority', ['bun', 'run', 'setup:https']);
    requireTestedState(testedSha);

    run('Types', ['bun', 'run', 'check']);
    run('Production build', ['bun', 'run', 'build']);
    run('Unit and Worker tests', ['bun', 'run', 'test']);

    run('Install browsers', ['bunx', 'playwright', 'install', 'chromium', 'webkit']);
    startServices();
    await waitForServices();
    run('Browser suite', ['bun', 'run', 'test:e2e']);

    const previewOrigin = deployPreviewWorker();
    await waitForPreview(previewOrigin);
    run('Deployment suite', ['bunx', 'playwright', 'test'], { KUEKI_E2E_ORIGIN: previewOrigin });

    // Signing a state that is no longer HEAD would attest to code nobody tested.
    requireTestedState(testedSha);
    run('Sign off', ['gh', 'signoff', '--commit', testedSha]);
    process.stdout.write(`\n✓ Local CI passed and signed off ${testedSha}\n`);
  } catch (error) {
    if (testedSha) reportFailure(testedSha);
    process.stderr.write(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

await main();
