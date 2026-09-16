import { defineConfig } from '@playwright/test';
import { audioFixture } from './e2e/audio-fixture';
import { appOrigin, DEPLOYMENT_SPECS, testsADeployment } from './e2e/origins';

const chromium = {
  channel: 'chromium',
  launchOptions: {
    args: [
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${audioFixture()}`,
      '--autoplay-policy=no-user-gesture-required',
    ],
  },
};

const localProjects = [
  { name: 'chromium', testIgnore: '**/webkit.spec.ts', use: chromium },
  { name: 'webkit', testMatch: '**/webkit.spec.ts', use: { browserName: 'webkit' as const } },
];
const deploymentProjects = [{ name: 'deployment', testMatch: DEPLOYMENT_SPECS, use: chromium }];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: 'list',
  use: {
    baseURL: appOrigin,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: testsADeployment ? deploymentProjects : localProjects,
});
