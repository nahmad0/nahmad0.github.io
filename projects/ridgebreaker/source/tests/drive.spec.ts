import { test, expect } from '@playwright/test';
test('keyboard controls, acceleration, left steering, braking, reverse, boost and recovery', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/?test');
  await expect(page.locator('#start')).toBeVisible();
  await page.screenshot({ path: 'tests/menu.png' });
  await page.click('#start');
  await page.evaluate(() => {
    (window as any).__game.active = false;
  });
  await page.keyboard.down('KeyW');
  const initial = await page.evaluate(() => {
    const g = (window as any).__game;
    g.vehicle.reset(12);
    for (let i = 0; i < 90; i++)
      g.step(1 / 60, { throttle: 0, steer: 0, brake: true, boost: false, winch: false });
    return g.snapshot();
  });
  const forward = await page.evaluate(() => {
    const g = (window as any).__game;
    for (let i = 0; i < 120; i++) g.step(1 / 60, g.controls.read());
    return g.snapshot();
  });
  expect(initial.grounded).toBe(4);
  expect(forward.position[2] - initial.position[2]).toBeGreaterThan(6);
  expect(forward.speed).toBeGreaterThan(6);
  expect(new Set(forward.suspension.map((s: number) => s.toFixed(3))).size).toBeGreaterThan(1);
  await page.keyboard.down('KeyA');
  const steering = await page.evaluate(() => {
    const g = (window as any).__game;
    const before = g.vehicle.quaternion.y;
    for (let i = 0; i < 35; i++) g.step(1 / 60, g.controls.read());
    return { input: g.controls.read(), before, after: g.vehicle.quaternion.y };
  });
  expect(steering.input.steer).toBe(-1);
  expect(steering.after).toBeLessThan(steering.before);
  await page.keyboard.up('KeyA');
  await page.keyboard.up('KeyW');
  await page.keyboard.down('Space');
  const stopped = await page.evaluate(() => {
    const g = (window as any).__game;
    for (let i = 0; i < 120; i++) g.step(1 / 60, g.controls.read());
    return g.snapshot();
  });
  expect(Math.abs(stopped.speed)).toBeLessThan(1.5);
  await page.keyboard.up('Space');
  await page.keyboard.down('KeyS');
  const reversed = await page.evaluate(() => {
    const g = (window as any).__game;
    g.vehicle.reset(12);
    for (let i = 0; i < 150; i++) g.step(1 / 60, g.controls.read());
    return g.snapshot();
  });
  expect(reversed.speed).toBeLessThan(-2);
  await page.keyboard.up('KeyS');
  await page.keyboard.down('KeyW');
  await page.keyboard.down('ShiftLeft');
  const boosted = await page.evaluate(() => {
    const g = (window as any).__game;
    g.vehicle.reset(12);
    for (let i = 0; i < 120; i++) g.step(1 / 60, g.controls.read());
    return g.snapshot();
  });
  expect(boosted.boost).toBeLessThan(70);
  expect(boosted.speed).toBeGreaterThan(forward.speed);
  await page.keyboard.up('KeyW');
  await page.keyboard.up('ShiftLeft');
  await page.evaluate(() => {
    const g = (window as any).__game;
    g.active = true;
  });
  await page.keyboard.press('KeyR');
  await expect
    .poll(() => page.evaluate(() => (window as any).__game.vehicle.position.z))
    .toBeLessThan(14);
  await page.keyboard.press('KeyC');
  await expect.poll(() => page.evaluate(() => (window as any).__game.rig.mode)).toBe(1);
  await page.screenshot({ path: 'tests/driving.png' });
  expect(errors).toEqual([]);
});
