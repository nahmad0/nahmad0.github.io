import { test, expect } from '@playwright/test';
test('save validation, checkpoints, salvage, upgrades, damage, winch and bridge reset', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?test');
  await page.click('#start');
  const r = await page.evaluate(() => {
    const g = (window as any).__game;
    g.active = false;
    const v = g.vehicle,
      e = g.expedition;
    const idle = { throttle: 0, steer: 0, brake: true, boost: false, winch: false };
    const step = (n: number, input = idle) => {
      for (let i = 0; i < n; i++) g.step(1 / 60, input);
    };
    v.reset(650);
    step(90);
    const skipped = e.camp;
    const item = e.items[0];
    v.reset(item.position.z, item.position.x);
    step(30);
    const salvage = e.collected.size;
    v.reset(132);
    step(90);
    const camp = e.camp,
      healthAtCamp = v.health,
      boostAtCamp = v.boost;
    const bought = e.upgrade(0, v),
      engine = v.engine;
    const saved = e.read();
    const restore = localStorage.getItem('ridgebreaker-save')!;
    localStorage.setItem('ridgebreaker-save', '{"version":1,"camp":99}');
    const invalid = e.read();
    localStorage.setItem('ridgebreaker-save', restore);
    const hidden = e.items[24];
    v.reset(hidden.position.z, hidden.position.x);
    step(50);
    const secret = e.collected.has(24);
    v.reset(20);
    step(90);
    const p = v.body.translation();
    v.body.setTranslation({ x: p.x, y: p.y + 20, z: p.z }, true);
    v.health = 100;
    step(170);
    const damage = v.health;
    v.reset(20);
    step(90);
    const anchor = v.position.clone().add({ x: 0, y: 5, z: 13 }),
      old = g.world.anchors;
    g.world.anchors = [anchor];
    const distanceBefore = v.position.distanceTo(anchor);
    step(60, { ...idle, brake: false, winch: true });
    const distanceAfter = v.position.distanceTo(anchor),
      attached = !!v.anchor;
    g.world.anchors = old;
    const slab = g.world.dynamics.find((d: any) => d.bridge);
    const home = slab.mesh.userData.homeZ;
    g.world.update(0.1, slab.mesh.position.clone().add({ x: 0, y: 2, z: 0 }));
    g.world.update(1, slab.mesh.position.clone().add({ x: 0, y: 2, z: 0 }));
    step(40);
    const fell = slab.body.isDynamic();
    g.world.resetBridge();
    const restored = slab.body.isFixed() && Math.abs(slab.body.translation().z - home) < 0.01;
    return {
      skipped,
      salvage,
      camp,
      healthAtCamp,
      boostAtCamp,
      bought,
      engine,
      saved,
      invalid,
      secret,
      damage,
      distanceBefore,
      distanceAfter,
      attached,
      fell,
      restored,
    };
  });
  console.log('Systems:', r);
  expect(r.skipped).toBe(0);
  expect(r.salvage).toBeGreaterThan(0);
  expect(r.camp).toBe(1);
  expect(r.healthAtCamp).toBe(100);
  expect(r.boostAtCamp).toBe(100);
  expect(r.bought).toBe(true);
  expect(r.engine).toBe(1);
  expect(r.saved.upgrades[0]).toBe(1);
  expect(r.invalid).toBeNull();
  expect(r.secret).toBe(true);
  expect(r.damage).toBeLessThan(100);
  expect(r.distanceAfter).toBeLessThan(r.distanceBefore);
  expect(r.fell).toBe(true);
  expect(r.restored).toBe(true);
  expect(errors).toEqual([]);
  await page.reload();
  await expect(page.locator('#continue')).toBeEnabled();
  await page.click('#continue');
  await expect.poll(() => page.evaluate(() => (window as any).__game.expedition.camp)).toBe(1);
});
test('menus, pause, settings, resizing and loading error recovery', async ({ page }) => {
  await page.goto('/?test');
  await page.click('#controls');
  await expect(page.getByRole('heading', { name: 'Know your rig.' })).toBeVisible();
  await page.click('#close-dialog');
  await page.click('#settings');
  await page.selectOption('#quality', 'low');
  await page.check('#rain');
  await page.locator('#volume').fill('0');
  await page.click('#close-dialog');
  await page.click('#start');
  await page.click('#pause');
  const t = await page.evaluate(() => (window as any).__game.expedition.seconds);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => (window as any).__game.expedition.seconds)).toBe(t);
  await page.click('#resume');
  await expect(page.locator('#dialog')).not.toBeVisible();
  await page.setViewportSize({ width: 800, height: 600 });
  await expect
    .poll(() => page.evaluate(() => (window as any).__game.camera.aspect))
    .toBeCloseTo(800 / 600);
  await page.screenshot({ path: 'tests/resize.png' });
  await page.keyboard.press('KeyU');
  await expect(page.getByRole('heading', { name: 'Build a better beast.' })).toBeVisible();
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
      if (type.startsWith('webgl')) return null;
      return (get as any).call(this, type, ...args);
    } as any;
  });
  await page.reload();
  await expect(page.getByText('The expedition could not load.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'RETRY' })).toBeVisible();
});
