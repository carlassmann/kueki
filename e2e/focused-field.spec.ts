import { test, expect } from '@playwright/test';

/** Exposes `offerUpdate()`, which makes the app believe a new service worker is waiting and show
    its update toast. Same trick as the room lifecycle spec. */
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

test('the keyboard does not leave a focused field underneath the update toast', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    locale: 'en-US',
  });
  await context.addInitScript(offerUpdateHook);
  const page = await context.newPage();
  await page.goto('/app');
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await page.getByTestId('create-room').click();
  await page.getByTestId('device-name').click();
  await page.evaluate(() => (window as unknown as { offerUpdate: () => void }).offerUpdate());
  await expect(page.locator('[data-sonner-toast]')).toBeVisible();

  // The on-screen keyboard shows up as a shorter viewport, which is what the app reacts to.
  await page.setViewportSize({ width: 390, height: 420 });
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--bottom-overlay').trim(),
      ),
    )
    .not.toBe('0px');

  const placement = await page.evaluate(() => {
    const input = document.querySelector('[data-testid="device-name"]')!;
    const field = input.getBoundingClientRect();
    const toasts = [...document.querySelectorAll('[data-sonner-toast]')].map((toast) =>
      toast.getBoundingClientRect(),
    );
    const centre = document.elementFromPoint(field.x + field.width / 2, field.y + field.height / 2);
    return {
      coveredByToast: toasts.some((toast) => field.bottom > toast.top && field.top < toast.bottom),
      centreIsTheField: centre === input,
      fieldOnScreen: field.top >= 0 && field.bottom <= window.innerHeight,
    };
  });

  expect(placement).toEqual({
    coveredByToast: false,
    centreIsTheField: true,
    fieldOnScreen: true,
  });
  await context.close();
});
