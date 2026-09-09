import * as T from 'three';
import { Vehicle } from '../vehicle/Vehicle';
import { campZ, roadX, height, branchX } from '../world/Terrain';
import { mat } from '../world/World';
export type Save = {
  version: 1;
  camp: number;
  parts: number;
  collected: number[];
  upgrades: number[];
  seconds: number;
};
export class Expedition {
  camp = 0;
  parts = 0;
  seconds = 0;
  won = false;
  collected = new Set<number>();
  items: T.Mesh[] = [];
  notification = '';
  notificationTime = 0;
  constructor(scene: T.Scene) {
    for (let i = 0; i < 24; i++) {
      const z = 40 + i * 25,
        x = i % 4 === 0 ? branchX(z) : roadX(z) + (i % 2 ? 3 : -3);
      const item = new T.Mesh(
        i % 4 === 0 ? new T.OctahedronGeometry(0.75) : new T.BoxGeometry(0.65, 0.9, 0.5),
        mat(i % 4 === 0 ? '#9dd8c0' : '#f2b760', {
          emissive: i % 4 === 0 ? '#498c7a' : '#96692c',
          emissiveIntensity: 0.4,
          metalness: 0.5,
        }),
      );
      item.position.set(x, height(x, z) + 1.8, z);
      item.userData.baseY = item.position.y;
      scene.add(item);
      this.items.push(item);
    }
    const z = 472,
      x = branchX(z) + 9;
    const secret = new T.Mesh(
      new T.OctahedronGeometry(1),
      mat('#b7e5d3', { emissive: '#67b49c', emissiveIntensity: 1 }),
    );
    secret.position.set(x, height(x, z) + 2, z);
    secret.userData.baseY = secret.position.y;
    scene.add(secret);
    this.items.push(secret);
  }
  message(s: string) {
    this.notification = s;
    this.notificationTime = 4;
  }
  update(dt: number, v: Vehicle) {
    this.seconds += dt;
    this.notificationTime = Math.max(0, this.notificationTime - dt);
    this.items.forEach((m, i) => {
      if (this.collected.has(i)) return;
      m.rotation.y += dt;
      m.position.y = m.userData.baseY + Math.sin(this.seconds * 2 + i) * 0.2;
      if (m.position.distanceTo(v.position) < 3.4) {
        this.collected.add(i);
        m.visible = false;
        this.parts += i === 24 ? 5 : i % 4 === 0 ? 3 : 1;
        v.boost = Math.min(100, v.boost + 15);
        this.message(
          i === 24
            ? 'SECRET FOUND · The lost prototype · +5 parts'
            : 'SALVAGED · Expedition parts recovered',
        );
        this.save(v);
      }
    });
    const next = campZ[this.camp + 1];
    if (
      next !== undefined &&
      Math.hypot(v.position.x - roadX(next), v.position.z - next) < 11 &&
      Math.abs(v.position.y - height(roadX(next), next)) < 7
    ) {
      this.camp++;
      v.health = 100;
      v.boost = 100;
      v.heat = 0;
      this.parts += 3;
      this.won = this.camp === campZ.length - 1;
      this.message(
        this.won
          ? 'SUMMIT REACHED · You broke the ridge.'
          : `CAMP 0${this.camp} · Repaired & resupplied · +3 parts`,
      );
      this.save(v);
    }
  }
  upgrade(kind: number, v: Vehicle) {
    const z = campZ[this.camp];
    if (Math.hypot(v.position.x - roadX(z), v.position.z - z) > 18) {
      this.message('Upgrades are available at checkpoint camps.');
      return false;
    }
    const values = [v.engine, v.tires, v.suspension];
    if (values[kind] >= 3) {
      this.message('This upgrade is already at maximum.');
      return false;
    }
    const cost = 3 + values[kind] * 2;
    if (this.parts < cost) {
      this.message(`Find ${cost - this.parts} more parts to upgrade.`);
      return false;
    }
    this.parts -= cost;
    if (kind === 0) v.engine++;
    if (kind === 1) v.tires++;
    if (kind === 2) v.suspension++;
    this.message(['ENGINE', 'TIRES', 'SUSPENSION'][kind] + ' UPGRADED');
    this.save(v);
    return true;
  }
  save(v: Vehicle) {
    try {
      localStorage.setItem(
        'ridgebreaker-save',
        JSON.stringify({
          version: 1,
          camp: this.camp,
          parts: this.parts,
          collected: [...this.collected],
          upgrades: [v.engine, v.tires, v.suspension],
          seconds: this.seconds,
        } satisfies Save),
      );
    } catch {
      this.message('Storage unavailable · Progress will last for this session.');
    }
  }
  read(): Save | null {
    try {
      const s = JSON.parse(localStorage.getItem('ridgebreaker-save') || 'null');
      if (
        s?.version !== 1 ||
        !Number.isInteger(s.camp) ||
        s.camp < 0 ||
        s.camp >= campZ.length ||
        !Number.isFinite(s.parts) ||
        s.parts < 0 ||
        !Array.isArray(s.collected) ||
        s.collected.some(
          (n: unknown) => !Number.isInteger(n) || Number(n) < 0 || Number(n) >= this.items.length,
        ) ||
        !Array.isArray(s.upgrades) ||
        s.upgrades.length !== 3 ||
        s.upgrades.some((n: unknown) => !Number.isInteger(n) || Number(n) < 0 || Number(n) > 3) ||
        !Number.isFinite(s.seconds) ||
        s.seconds < 0
      )
        return null;
      return s;
    } catch {
      return null;
    }
  }
  start(v: Vehicle, continuing: boolean) {
    const s = continuing ? this.read() : null;
    this.camp = s?.camp ?? 0;
    this.parts = s?.parts ?? 0;
    this.seconds = s?.seconds ?? 0;
    this.collected = new Set(s?.collected ?? []);
    [v.engine, v.tires, v.suspension] = s?.upgrades ?? [0, 0, 0];
    this.items.forEach((m, i) => (m.visible = !this.collected.has(i)));
    this.won = this.camp === 5;
    v.health = 100;
    v.boost = 100;
    v.heat = 0;
    v.reset(campZ[this.camp]);
    this.save(v);
  }
}
