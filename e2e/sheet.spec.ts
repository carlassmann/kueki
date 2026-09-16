import { test, expect, type Browser, type Page } from '@playwright/test';

/** Both of these measure the sheet's own transform, because the bugs they cover were visible only
    as motion: the sheet reached the right place, but jumped somewhere else on the way. */

async function openSheet(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    locale: 'en-US',
  });
  const page = await context.newPage();
  await page.goto('/app');
  await page.getByTestId('create-room').click();
  await page.getByTestId('role-parent').click();
  await page.getByTestId('device-name').fill('Sheet');
  await page.getByTestId('submit-room').click();
  await expect(page.getByTestId('connection-status')).toHaveAttribute('data-status', 'connected');
  await page.getByTestId('nav-settings').click();
  await page.getByTestId('open-privacy').click();
  await expect(page.getByTestId('privacy-modal')).toBeVisible();
  return { context, page, sheet: page.getByTestId('privacy-modal') };
}

/** Samples the sheet's translateY every frame for `durationMs`. */
function sampleTranslateY(page: Page, durationMs: number) {
  return page.evaluate((duration) => {
    const sheet = document.querySelector('[data-testid="privacy-modal"]') as HTMLElement;
    return new Promise<number[]>((resolve) => {
      const values: number[] = [];
      const until = performance.now() + duration;
      const sample = () => {
        values.push(new DOMMatrixReadOnly(getComputedStyle(sheet).transform).m42);
        if (performance.now() < until) requestAnimationFrame(sample);
        else resolve(values);
      };
      requestAnimationFrame(sample);
    });
  }, durationMs);
}

test('a released swipe glides the sheet back from where the finger left it', async ({
  browser,
}) => {
  const { context, page, sheet } = await openSheet(browser);
  await page.waitForTimeout(600); // let the entry animation finish
  const box = (await sheet.boundingBox())!;
  const startY = box.y + 20;
  const releaseOffset = 40;
  await page.mouse.move(box.x + box.width / 2, startY);
  await page.mouse.down();
  for (const step of [10, 20, 30, releaseOffset]) {
    await page.mouse.move(box.x + box.width / 2, startY + step);
    await page.waitForTimeout(120); // a slow drag, so the release is not read as a flick
  }
  const samples = sampleTranslateY(page, 700);
  await page.mouse.up();
  const values = await samples;

  // Re-running the entry animation would send it to the full sheet height first.
  expect(Math.max(...values)).toBeLessThanOrEqual(releaseOffset + 4);
  expect(Math.round(values.at(-1)!)).toBe(0);
  await expect(sheet).toBeVisible();
  await context.close();
});

test('a gesture the browser claims leaves the entry animation alone', async ({ browser }) => {
  const { context, page, sheet } = await openSheet(browser);
  const samples = sampleTranslateY(page, 500);
  // iOS cancels the pointer once it decides the gesture is a scroll, before any drag threshold.
  await page.evaluate(() => {
    const dialog = document.querySelector('[data-testid="privacy-modal"]')!;
    const box = dialog.getBoundingClientRect();
    const touch = {
      bubbles: true,
      pointerId: 1,
      pointerType: 'touch',
      clientX: box.x + box.width / 2,
      clientY: box.y + 20,
    };
    dialog.dispatchEvent(new PointerEvent('pointerdown', touch));
    dialog.dispatchEvent(new PointerEvent('pointercancel', touch));
  });
  const values = await samples;

  // Settling a sheet that never moved would cut the slide short instead of letting it play out.
  const midSlide = values.filter((value) => value > 1 && value < values[0]! - 1);
  expect(midSlide.length).toBeGreaterThan(20);
  expect(Math.round(values.at(-1)!)).toBe(0);
  await expect(sheet).toBeVisible();
  await context.close();
});
