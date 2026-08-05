const { test, expect } = require('@playwright/test');

const suffix = Date.now();
const EMAIL = `demo${suffix}@pp.com`;
const PASSWORD = 'secret123';
const DEVICE_CODE = `PP-TEST-${suffix}`;

test.describe('PowerPulse full demo scenario', () => {
  test('registration -> location -> simulator OFF/ON -> dashboard + notification + history', async ({ page }) => {
    // 1. Register a new user via the UI.
    await page.goto('/register.html');
    await page.fill('#name', 'Demo User');
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForURL('**/dashboard.html');

    // 2. Add a location "My Home".
    await page.goto('/setup.html');
    await page.fill('#loc-name', 'My Home');
    await page.fill('#loc-address', '12 Main Street');
    await page.click('#loc-form button[type=submit]');
    await expect(page.locator('#dev-loc')).toContainText('My Home');

    // 3. Connect a device to it.
    await page.fill('#dev-code', DEVICE_CODE);
    await page.selectOption('#dev-loc', { label: 'My Home' });
    await page.click('#dev-form button[type=submit]');
    await expect(page.locator('#devices-list', { hasText: DEVICE_CODE })).toBeVisible();

    // 4. Set the initial power state to ON (simulating a fresh install where power is available).
    const res = await page.request.post('/devices/status', {
      data: { deviceCode: DEVICE_CODE, status: 'ON' },
    });
    expect(res.ok()).toBeTruthy();

    // 5. Dashboard should show POWER AVAILABLE.
    await page.goto('/dashboard.html');
    await expect(page.locator('.status.on', { hasText: 'POWER AVAILABLE' })).toBeVisible();

    // 6. Open the simulator and trigger POWER OFF.
    await page.goto('/simulator/simulator.html');
    await page.fill('#sim-code-input', DEVICE_CODE);
    await page.click('#btn-off');
    await expect(page.locator('#sim-status')).toHaveText(/POWER UNAVAILABLE/);

    // 7. Dashboard updates to POWER UNAVAILABLE (polling) with a notification.
    await page.goto('/dashboard.html');
    await expect(page.locator('.status.off', { hasText: 'POWER UNAVAILABLE' })).toBeVisible();
    await expect(page.locator('#notifications', { hasText: 'Power has gone off at My Home.' })).toBeVisible();

    // 8. Trigger POWER ON in the simulator.
    await page.goto('/simulator/simulator.html');
    await page.fill('#sim-code-input', DEVICE_CODE);
    await page.click('#btn-on');
    await expect(page.locator('#sim-status')).toHaveText(/POWER AVAILABLE/);

    // 9. Dashboard shows POWER AVAILABLE again and a restoration notification.
    await page.goto('/dashboard.html');
    await expect(page.locator('.status.on', { hasText: 'POWER AVAILABLE' })).toBeVisible();
    await expect(page.locator('#notifications', { hasText: 'Power has been restored at My Home.' })).toBeVisible();

    // 10. History shows the complete ON/OFF timeline.
    await page.goto('/history.html');
    const table = page.locator('table tbody');
    await expect(table).toBeVisible();
    await expect(table.locator('tr').first()).toBeVisible();
    const onRows = await table.locator('tr').count();
    expect(onRows).toBeGreaterThanOrEqual(2);
  });
});
