import { test, expect } from '@playwright/test';

/** Same trick as the focused field spec: makes the app believe a new service worker is waiting. */
const offerUpdateHook = () => {
  const register = navigator.serviceWorker.register.bind(navigator.serviceWorker);
  navigator.serviceWorker.register = async (...args) => {
    const registration = await register(...args);
    const worker = Object.assign(new EventTarget(), { state: 'installed', postMessage: () => {} });
    Object.assign(window, {
      offerUpdate: () => {
        Object.defineProperty(registration, 'installing', { value: worker, configurable: true });
        registration.dispatchEvent(new Event('updatefound'));
        worker.dispatchEvent(new Event('statechange'));
      },
    });
    return registration;
  };
};

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`the update toast keeps its close button off the update button at ${viewport.width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport, locale: 'en-US' });
    await context.addInitScript(offerUpdateHook);
    const page = await context.newPage();
    await page.goto('/app');
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await page.evaluate(() => (window as unknown as { offerUpdate: () => void }).offerUpdate());

    const toast = page.locator('[data-sonner-toast]', { hasText: 'Kueki update available' });
    const update = toast.locator('[data-button]');
    const close = toast.locator('[data-close-button]');
    await expect(update).toBeVisible();
    await expect(close).toBeVisible();

    const updateBox = (await update.boundingBox())!;
    const closeBox = (await close.boundingBox())!;
    expect(updateBox.x + updateBox.width).toBeLessThanOrEqual(closeBox.x);
    await context.close();
  });
}
