import { readFile, writeFile } from 'node:fs/promises';
import { baseLandingMessages } from '../src/intl/messages.landing';
import { translate } from '../src/intl/standalone';

const t = translate('en');
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

const hero = escapeHtml(baseLandingMessages['welcome.hero'])
  .replaceAll('{#br}{/br}', '<br />')
  .replace('{#em}', '<em>')
  .replace('{/em}', '</em>');

const landing = `<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="/" aria-label="${escapeHtml(t('app.homeLabel'))}">
      <img src="/icon.svg" alt="" />kueki
    </a>
  </header>
  <main class="welcome">
    <section class="welcome-art"><h1>${hero}</h1></section>
    <section class="welcome-content">
      <h2>${escapeHtml(t('welcome.title'))}</h2>
      <p>${escapeHtml(t('welcome.intro'))}</p>
      <div class="welcome-actions">
        <a href="/app/create" data-ui="button" data-variant="primary">${escapeHtml(t('welcome.createRoom'))}</a>
        <a href="/app/join" data-ui="button" data-variant="secondary">${escapeHtml(t('welcome.joinRoom'))}</a>
      </div>
      <section class="steps">
        <h3>${escapeHtml(t('welcome.stepsTitle'))}</h3>
        <ol>
          <li>${escapeHtml(t('welcome.stepCreate'))}</li>
          <li>${escapeHtml(t('welcome.stepInvite'))}</li>
          <li>${escapeHtml(t('welcome.stepListen'))}</li>
        </ol>
      </section>
    </section>
  </main>
</div>`;

const html = await readFile('dist/index.html', 'utf8');
const root = '<div id="root"></div>';
if (!html.includes(root)) throw new Error('Vite root element not found');

await writeFile('dist/index.html', html.replace(root, `<div id="root">${landing}</div>`));
await writeFile(
  'dist/app-shell.txt',
  html.replace('<head>', '<head>\n    <meta name="robots" content="noindex" />'),
);
