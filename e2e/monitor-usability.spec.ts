import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { BinaryBitmap, HybridBinarizer, RGBLuminanceSource, QRCodeReader } from '@zxing/library';

test('invitation QR opens a compact join flow; activity clear is confirmed and failures stay in the dialog', async ({
  page,
}) => {
  await page.goto('/app/create');
  await page.getByTestId('submit-room').click();
  await expect(page.getByTestId('connection-status')).toHaveAttribute('data-status', 'connected');
  await expect(page.getByTestId('monitor-readiness')).toContainText('Notifications off');
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('kueki-session')!));
  await page.getByTestId('invite-device').click();
  const source = await page.locator('.invitation-qr img').getAttribute('src');
  const { data, info } = await sharp(Buffer.from(source!.split(',')[1]!, 'base64'))
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const invitation = new QRCodeReader()
    .decode(
      new BinaryBitmap(
        new HybridBinarizer(
          new RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height),
        ),
      ),
    )
    .getText();
  const link = new URL(invitation);
  expect(link.origin + link.pathname).toBe(`${new URL(page.url()).origin}/app/join`);
  expect(new URLSearchParams(link.hash.slice(1)).get('join')).toBe(session.roomKey);
  expect(new URLSearchParams(link.hash.slice(1)).get('room')).toBe(session.roomName);
  await page.getByTestId('close-dialog').click();
  const guest = await page.context().browser()!.newContext();
  const joining = await guest.newPage();
  await joining.goto(invitation);
  // The link carries the room name, so the joining device can say where it is going.
  await expect(joining.getByRole('heading', { level: 2 })).toHaveText(`Join ${session.roomName}`);
  await expect(joining.getByTestId('submit-room')).toBeDisabled();
  await expect(joining.getByTestId('invitation-code')).toBeHidden();
  await joining.getByTestId('change-invitation').click();
  await expect(joining.getByTestId('invitation-code')).toHaveValue(session.roomKey);
  await joining.getByTestId('change-invitation').click();
  await joining.getByTestId('role-parent').click();
  await joining.getByTestId('submit-room').click();
  await expect(joining.getByTestId('connection-status')).toHaveAttribute(
    'data-status',
    'connected',
  );
  await guest.close();

  // A real baby heartbeat produces the pause event used for the shared activity checks.
  const baby = await (
    await page.request.post('/api/register', {
      data: { roomKey: session.roomKey, role: 'baby', name: 'Nursery' },
    })
  ).json();
  await page.evaluate(async (baby) => {
    await new Promise<void>((resolve) => {
      const socket = new WebSocket(
        `${location.origin.replace('http', 'ws')}/api/ws?roomId=${baby.roomId}`,
      );
      socket.onopen = () =>
        socket.send(JSON.stringify({ type: 'hello', deviceId: baby.deviceId, token: baby.token }));
      let monitoring = false;
      socket.onmessage = ({ data }) => {
        const message = JSON.parse(data);
        if (message.type === 'ready')
          socket.send(
            JSON.stringify({ type: 'heartbeat', token: baby.token, monitoring: true, level: 0 }),
          );
        if (
          message.type === 'state' &&
          message.devices.some(
            (device: { id: string; monitoring: boolean }) =>
              device.id === baby.deviceId && device.monitoring,
          )
        ) {
          monitoring = true;
          socket.send(
            JSON.stringify({ type: 'heartbeat', token: baby.token, monitoring: false, level: 0 }),
          );
        } else if (message.type === 'state' && monitoring) {
          socket.close();
          resolve();
        }
      };
    });
  }, baby);
  await page.getByTestId('nav-settings').click();
  await page.getByTestId('alert-retentionMs').selectOption('259200000');
  await page.getByTestId('nav-activity').click();
  await expect(page.getByTestId('activity-window')).toHaveText('Last 3 days');
  await expect(page.getByTestId('activity-event').first().locator('time')).toHaveAttribute(
    'datetime',
    /T/,
  );
  await page.getByTestId('clear-activity').click();
  await page.getByTestId('keep-activity').click();
  await expect(page.getByTestId('activity-event').first()).toBeVisible();
  await page.route('**/api/clear-events', (route) =>
    route.fulfill({ status: 503, json: { error: 'Try again shortly.' } }),
  );
  await page.getByTestId('clear-activity').click();
  await page.getByTestId('confirm-clear-activity').click();
  await expect(page.getByTestId('clear-activity-dialog')).toContainText('Try again shortly.');
  await page.unroute('**/api/clear-events');
  await page.getByTestId('confirm-clear-activity').click();
  await expect(page.getByTestId('clear-activity-dialog')).toBeHidden();
  await expect(page.getByTestId('activity-empty')).toBeVisible();
  await page.getByTestId('nav-settings').click();
  await page.getByLabel('Language', { exact: true }).selectOption('de');
  await page.getByTestId('nav-monitor').click();
  await page.locator('[data-testid="sensitivity-details"] summary').click();
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 852 });
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      expect(
        await page.getByTestId('device-card').evaluate((card) => {
          const bounds = card.getBoundingClientRect();
          return [...card.querySelectorAll('button, input')].every((control) => {
            const rect = control.getBoundingClientRect();
            return rect.left >= bounds.left && rect.right <= bounds.right;
          });
        }),
      ).toBe(true);
      expect(
        await page.locator('.room-scroll').evaluate((scroll) => {
          const nav = document.querySelector('.room-navigation')!.getBoundingClientRect();
          return scroll.getBoundingClientRect().bottom <= nav.top;
        }),
      ).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
});

test('live audio recovers after the parent reconnects; failed recovery can be retried and stopped attempts stay stopped', async ({
  browser,
}) => {
  const babyContext = await browser.newContext({ permissions: ['microphone'] });
  const parentContext = await browser.newContext();
  const baby = await babyContext.newPage();
  const parent = await parentContext.newPage();
  async function reconnectParent() {
    const before = await parent.evaluate(() => (window as any).socketCount);
    await parent.evaluate(() => (window as any).roomSocket.close());
    await expect
      .poll(() => parent.evaluate(() => (window as any).socketCount))
      .toBeGreaterThan(before);
    await expect(parent.getByTestId('connection-status')).toHaveAttribute(
      'data-status',
      'connected',
    );
  }
  await parent.addInitScript(() => {
    const Original = window.WebSocket;
    window.WebSocket = class extends Original {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        if (String(url).includes('/api/ws'))
          Object.assign(window, {
            roomSocket: this,
            socketCount: ((window as any).socketCount || 0) + 1,
          });
      }
    };
  });
  await baby.goto('/app/create');
  await baby.getByTestId('role-baby').click();
  await baby.getByTestId('submit-room').click();
  await expect(baby.getByTestId('connection-status')).toHaveAttribute('data-status', 'connected');
  const session = await baby.evaluate(() => JSON.parse(localStorage.getItem('kueki-session')!));
  await baby.getByTestId('monitor-toggle').click();
  await parent.goto(`/app/join#join=${session.roomKey}`);
  await parent.getByTestId('role-parent').click();
  await parent.getByTestId('submit-room').click();
  await parent.getByTestId('listen-toggle').click();
  await expect(parent.getByTestId('audio-status')).toHaveAttribute('data-status', 'live');
  await reconnectParent();
  await expect(parent.getByTestId('connection-status')).toHaveAttribute('data-status', 'connected');
  await expect(parent.getByTestId('audio-status')).toHaveAttribute('data-status', 'live');
  await expect(parent.locator('audio')).toHaveCount(1);
  const at = await parent.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime);
  await expect
    .poll(() => parent.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime))
    .toBeGreaterThan(at + 0.2);

  await parent.route('**/api/ice', (route) =>
    route.fulfill({ status: 503, json: { error: 'Audio unavailable.' } }),
  );
  await reconnectParent();
  await expect(parent.getByTestId('audio-status')).toHaveAttribute('data-status', 'failed');
  await expect(parent.getByTestId('resume-audio')).toBeVisible();
  await parent.unroute('**/api/ice');
  await parent.getByTestId('resume-audio').click();
  await expect(parent.getByTestId('error-notice')).toHaveCount(0);
  await expect(parent.getByTestId('audio-status')).toHaveAttribute('data-status', 'live');
  await parent.getByTestId('listen-toggle').click();
  await reconnectParent();
  await expect(parent.getByTestId('connection-status')).toHaveAttribute('data-status', 'connected');
  await expect(parent.getByTestId('audio-status')).toHaveAttribute('data-status', 'off');
  await expect(parent.locator('audio')).toHaveCount(0);

  let release!: () => void;
  let reached!: () => void;
  const held = new Promise<void>((resolve) => {
    reached = resolve;
  });
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await parent.route('**/api/ice', async (route) => {
    const response = await route.fetch();
    reached();
    await pending;
    await route.fulfill({ response });
  });
  await parent.getByTestId('listen-toggle').click();
  await held;
  await parent.getByTestId('listen-toggle').click();
  const completed = parent.waitForResponse('**/api/ice');
  release();
  await completed;
  await expect(parent.getByTestId('audio-status')).toHaveAttribute('data-status', 'off');
  await expect(parent.locator('audio')).toHaveCount(0);
  await baby.getByTestId('monitor-toggle').click();
  // On Monitor the summary carries the pause; a banner would say it a second time.
  await expect(parent.getByTestId('nest-summary')).toHaveAttribute('data-state', 'paused');
  await expect(parent.getByTestId('event-notice')).toHaveCount(0);
  await baby.getByTestId('monitor-toggle').click();
  await expect(parent.getByTestId('nest-summary')).not.toHaveAttribute('data-state', 'paused');
  await parent.getByTestId('listen-toggle').click();
  await expect(parent.getByTestId('audio-status')).toHaveAttribute('data-status', 'live');
  if (await parent.getByTestId('dismiss-notice').isVisible())
    await parent.getByTestId('dismiss-notice').click();
  await parent.setViewportSize({ width: 393, height: 852 });
  await parent.emulateMedia({ colorScheme: 'light' });
  await parent.screenshot({ path: 'artifacts/monitor-after-light.png', animations: 'disabled' });
  await parent.emulateMedia({ colorScheme: 'dark' });
  await parent.screenshot({ path: 'artifacts/monitor-after-dark.png', animations: 'disabled' });
  await parentContext.close();
  await babyContext.close();
});
