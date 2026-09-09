import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
test('drive the entire expedition using physics, without teleporting or skipping camps', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?test');
  await expect(page.locator('#start')).toBeVisible();
  await page.click('#start');
  const report = await page.evaluate(() => {
    const g = (window as any).__game;
    g.active = false;
    const input = { throttle: 0, steer: 0, brake: false, boost: false, winch: false };
    for (let n = 0; n < 90; n++) g.step(1 / 60, { ...input, brake: true });
    const trace: any[] = [];
    let stuck = 0,
      previous = 0,
      airFrames = 0,
      minClearance = 100;
    for (let n = 0; n < 18000; n++) {
      const v = g.vehicle,
        p = v.position;
      const ahead = p.z + Math.max(7, Math.abs(v.speed) * 0.8);
      const tx = 22 * Math.sin(ahead / 68) + 12 * Math.sin(ahead / 33);
      const q = v.quaternion;
      const fx = 2 * (q.x * q.z + q.w * q.y),
        fz = 1 - 2 * (q.x * q.x + q.y * q.y);
      let angle = Math.atan2(tx - p.x, ahead - p.z) - Math.atan2(fx, fz);
      angle = Math.atan2(Math.sin(angle), Math.cos(angle));
      g.step(1 / 60, {
        ...input,
        throttle: Math.abs(v.speed) > 9 ? 0 : 0.8,
        steer: Math.max(-1, Math.min(1, angle * 2)),
      });
      if (v.grounded === 0) airFrames++;
      if (n % 30 === 0) {
        g.rig.update(0.5, v, false);
        minClearance = Math.min(minClearance, g.snapshot().cameraClearance);
      }
      if (n % 600 === 0) {
        trace.push({ tick: n, position: p.toArray(), camp: g.expedition.camp, health: v.health });
        if (p.z < previous + 1) stuck++;
        else stuck = 0;
        previous = p.z;
      }
      if (g.expedition.won || stuck > 3) break;
    }
    g.ui.update(g.vehicle, g.expedition, 'Chase');
    g.renderer.render(g.scene, g.camera);
    return {
      trace,
      final: g.snapshot(),
      airFrames,
      minClearance,
      rockslide: g.world.rockslide,
      collapsed: g.world.dynamics.filter((d: any) => d.bridge && d.body.isDynamic()).length,
      save: g.expedition.read(),
    };
  });
  writeFileSync('tests/route-report.json', JSON.stringify(report, null, 2));
  console.log('Route:', JSON.stringify(report));
  expect(report.final.won).toBe(true);
  expect(report.final.camp).toBe(5);
  expect(report.final.position[2]).toBeGreaterThan(638);
  expect(report.minClearance).toBeGreaterThan(0.5);
  expect(report.collapsed).toBeGreaterThan(0);
  expect(report.rockslide).toBe(true);
  expect(report.save?.camp).toBe(5);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'tests/summit.png' });
});
test('boosted ramp launch becomes airborne and lands on real terrain', async ({ page }) => {
  await page.goto('/?test');
  await page.click('#start');
  const r = await page.evaluate(() => {
    const g = (window as any).__game;
    g.active = false;
    g.vehicle.reset(450);
    const idle = { throttle: 0, steer: 0, brake: true, boost: false, winch: false };
    for (let i = 0; i < 90; i++) g.step(1 / 60, idle);
    let air = 0,
      landed = false,
      maxSpeed = 0;
    for (let i = 0; i < 600; i++) {
      const p = g.vehicle.position,
        q = g.vehicle.quaternion,
        ahead = p.z + 12,
        tx = 22 * Math.sin(ahead / 68) + 12 * Math.sin(ahead / 33);
      let angle =
        Math.atan2(tx - p.x, ahead - p.z) -
        Math.atan2(2 * (q.x * q.z + q.w * q.y), 1 - 2 * (q.x * q.x + q.y * q.y));
      angle = Math.atan2(Math.sin(angle), Math.cos(angle));
      g.step(1 / 60, {
        ...idle,
        throttle: p.z < 490 ? 1 : 0,
        boost: p.z < 490,
        brake: false,
        steer: Math.max(-1, Math.min(1, angle * 2)),
      });
      maxSpeed = Math.max(maxSpeed, g.vehicle.speed);
      if (g.vehicle.grounded === 0) air++;
      else if (air > 5) landed = true;
    }
    return { air, landed, maxSpeed, final: g.snapshot() };
  });
  console.log('Jump:', r);
  expect(r.air).toBeGreaterThan(5);
  expect(r.landed).toBe(true);
  expect(r.final.position[1]).toBeGreaterThan(50);
});
