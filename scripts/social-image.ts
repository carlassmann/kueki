import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const width = 1200;
const height = 630;

const background = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="sky" x2="1" y2="1">
      <stop stop-color="#f7f8fc"/>
      <stop offset="1" stop-color="#e3eaf5"/>
    </linearGradient>
    <radialGradient id="warm">
      <stop stop-color="#fff3cd" stop-opacity=".95"/>
      <stop offset="1" stop-color="#fff3cd" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#sky)"/>
  <circle cx="1025" cy="60" r="320" fill="url(#warm)"/>
  <circle cx="88" cy="610" r="250" fill="#f2deda" opacity=".3"/>
  <path d="M0 552 Q250 485 505 561 T1200 526 V630 H0Z" fill="#d7e2f0" opacity=".7"/>
  <path d="M0 582 Q330 525 641 594 T1200 555 V630 H0Z" fill="#cddbec" opacity=".65"/>
  <rect x="70" y="72" width="128" height="44" rx="22" fill="#dce7f5"/>
  <text x="92" y="101" fill="#405984" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="3">KUEKI</text>
  <text x="68" y="258" fill="#324b72" font-family="Arial Rounded MT Bold, Trebuchet MS, sans-serif" font-size="65" font-weight="700">A little peace</text>
  <text x="68" y="336" fill="#324b72" font-family="Arial Rounded MT Bold, Trebuchet MS, sans-serif" font-size="65" font-weight="700">of mind.</text>
  <text x="72" y="406" fill="#60728b" font-family="Arial, sans-serif" font-size="24">A private baby monitor for your own devices.</text>
  <rect x="730" y="108" width="402" height="402" rx="94" fill="#6d83a8" opacity=".12"/>
  <rect x="721" y="99" width="402" height="402" rx="94" fill="#fff" opacity=".7"/>
  <circle cx="702" cy="105" r="5" fill="#f0c97d"/>
  <circle cx="1142" cy="513" r="7" fill="#eab6a7"/>
  <path d="M1138 80v22m-11-11h22" stroke="#e8bc76" stroke-width="5" stroke-linecap="round" opacity=".8"/>
</svg>`;

const icon = await readFile(new URL('../public/icon.svg', import.meta.url));
const iconPng = await sharp(icon).resize(390, 390).png().toBuffer();

await sharp(Buffer.from(background))
  .composite([{ input: iconPng, left: 727, top: 105 }])
  .png()
  .toFile(fileURLToPath(new URL('../public/social-image.png', import.meta.url)));
