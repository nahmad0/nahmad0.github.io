import * as T from 'three';
import { Vehicle } from '../vehicle/Vehicle';
export class Effects {
  particles: T.Points;
  rain: T.Points;
  positions: Float32Array;
  velocities: Float32Array;
  life: Float32Array;
  cursor = 0;
  rainEnabled = false;
  constructor(scene: T.Scene) {
    const count = 240;
    this.positions = new Float32Array(count * 3).fill(-1000);
    this.velocities = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(this.positions, 3));
    this.particles = new T.Points(
      g,
      new T.PointsMaterial({
        color: '#bdb49a',
        size: 0.2,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    this.particles.frustumCulled = false;
    scene.add(this.particles);
    const rp = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      rp[i * 3] = (Math.random() - 0.5) * 60;
      rp[i * 3 + 1] = Math.random() * 40;
      rp[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    const rg = new T.BufferGeometry();
    rg.setAttribute('position', new T.BufferAttribute(rp, 3));
    this.rain = new T.Points(
      rg,
      new T.PointsMaterial({ color: '#b9d2ce', size: 0.08, transparent: true, opacity: 0.6 }),
    );
    scene.add(this.rain);
    this.rain.visible = false;
  }
  update(dt: number, v: Vehicle) {
    if (v.grounded && Math.abs(v.speed) > 2) {
      for (let n = 0; n < (v.boosting ? 4 : 2); n++) {
        const i = this.cursor++ % this.life.length;
        const p = v.model.wheels[n % 4].getWorldPosition(new T.Vector3());
        this.positions.set([p.x, p.y - 0.7, p.z], i * 3);
        this.velocities.set(
          [(Math.random() - 0.5) * 2, 1 + Math.random() * 2, -v.speed * 0.18],
          i * 3,
        );
        this.life[i] = 0.8;
      }
    }
    for (let i = 0; i < this.life.length; i++)
      if (this.life[i] > 0) {
        this.life[i] -= dt;
        for (let j = 0; j < 3; j++) this.positions[i * 3 + j] += this.velocities[i * 3 + j] * dt;
        if (this.life[i] <= 0) this.positions[i * 3 + 1] = -1000;
      }
    this.particles.geometry.attributes.position.needsUpdate = true;
    (this.particles.material as T.PointsMaterial).color.set(
      v.terrain === 'water' ? '#b4e4de' : v.terrain === 'mud' ? '#70583e' : '#c9b991',
    );
    this.rain.visible = this.rainEnabled;
    if (this.rainEnabled) {
      this.rain.position.copy(v.position);
      const a = this.rain.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) a.setY(i, (a.getY(i) - dt * 18 + 40) % 40);
      a.needsUpdate = true;
    }
  }
}
