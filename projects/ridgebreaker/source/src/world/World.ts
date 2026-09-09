import * as T from 'three';
import R from '@dimforge/rapier3d-compat';
import { height, roadX, roadY, campZ, branchX } from './Terrain';
import { batchStatic } from '../assets/GeometryBatch';
export const mat = (color: string, extra = {}) =>
  new T.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
export const palette = {
  rock: mat('#77827b'),
  wood: mat('#655044'),
  iron: mat('#344346', { metalness: 0.65 }),
  orange: mat('#e38a3a'),
  cream: mat('#e3dac0'),
  glow: mat('#a7f2dc', { emissive: '#65d8b5', emissiveIntensity: 2 }),
};
export function box(parent: T.Object3D, size: number[], pos: number[], material: T.Material) {
  const m = new T.Mesh(new T.BoxGeometry(...(size as [number, number, number])), material);
  m.position.set(...(pos as [number, number, number]));
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function pole(parent: T.Object3D, a: T.Vector3, b: T.Vector3, r: number, material: T.Material) {
  const m = new T.Mesh(new T.CylinderGeometry(r, r, a.distanceTo(b), 6), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  parent.add(m);
  return m;
}
type Dynamic = { body: R.RigidBody; mesh: T.Object3D; bridge?: boolean; triggered?: number };
export class World {
  dynamics: Dynamic[] = [];
  anchors: T.Vector3[] = [];
  camps: T.Group[] = [];
  water: T.Mesh;
  time = 0;
  rockslide = false;
  constructor(
    public scene: T.Scene,
    public physics: R.World,
  ) {
    this.forest();
    this.rocks();
    this.landmarks();
    this.water = new T.Mesh(
      new T.PlaneGeometry(360, 18, 30, 4),
      mat('#629c9f', { transparent: true, opacity: 0.73, metalness: 0.3, roughness: 0.24 }),
    );
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(0, roadY(379) - 0.4, 379);
    scene.add(this.water);
    batchStatic(scene, new Set(this.dynamics.map((d) => d.mesh)));
    this.camps.forEach((c) => batchStatic(c));
  }
  staticBox(size: number[], pos: number[], material: T.Material = palette.wood, rotation = 0) {
    const mesh = box(this.scene, size, pos, material);
    mesh.rotation.y = rotation;
    this.physics.createCollider(
      R.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2)
        .setTranslation(pos[0], pos[1], pos[2])
        .setRotation({ x: 0, y: Math.sin(rotation / 2), z: 0, w: Math.cos(rotation / 2) }),
    );
    return mesh;
  }
  forest() {
    let seed = 92;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const positions: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < 1500; i++) {
      const x = (rnd() - 0.5) * 320,
        z = rnd() * 740 - 45;
      if (
        Math.min(Math.abs(x - roadX(z)), Math.abs(x - branchX(z))) < 12 ||
        z > 615 ||
        Math.abs(z - 379) < 12
      )
        continue;
      positions.push({ x, z, s: 3 + rnd() * 6 });
    }
    const trunk = new T.InstancedMesh(
      new T.CylinderGeometry(0.12, 0.22, 1, 5),
      palette.wood,
      positions.length,
    );
    const leaves = new T.InstancedMesh(
      new T.ConeGeometry(1, 1, 7),
      mat('#294f45', { flatShading: true }),
      positions.length * 3,
    );
    const o = new T.Object3D();
    positions.forEach(({ x, z, s }, i) => {
      const y = height(x, z);
      o.position.set(x, y + s * 0.3, z);
      o.scale.set(s * 0.35, s * 0.6, s * 0.35);
      o.rotation.set(0, 0, 0);
      o.updateMatrix();
      trunk.setMatrixAt(i, o.matrix);
      for (let j = 0; j < 3; j++) {
        o.position.set(x, y + s * (0.52 + j * 0.2), z);
        o.scale.set(s * (0.42 - j * 0.09), s * 0.65, s * (0.42 - j * 0.09));
        o.rotation.y = i * 1.3;
        o.updateMatrix();
        leaves.setMatrixAt(i * 3 + j, o.matrix);
        leaves.setColorAt(
          i * 3 + j,
          new T.Color().setHSL(0.4 + (i % 5) * 0.007, 0.22, 0.2 + (i % 7) * 0.012),
        );
      }
      if (i % 5 === 0) {
        this.physics.createCollider(
          R.ColliderDesc.cylinder(s * 0.3, s * 0.13).setTranslation(x, y + s * 0.3, z),
        );
        this.anchors.push(new T.Vector3(x, y + 2, z));
      }
    });
    trunk.castShadow = true;
    leaves.castShadow = true;
    this.scene.add(trunk, leaves);
    // Far silhouettes give the valley depth without physics or expensive materials.
    for (let i = 0; i < 28; i++) {
      const m = new T.Mesh(
        new T.ConeGeometry(50 + (i % 4) * 12, 80 + (i % 5) * 18, 5),
        mat(i % 2 ? '#667e7c' : '#80928c', { flatShading: true }),
      );
      const z = -70 + i * 34,
        x = i % 2 ? -240 : 240;
      m.position.set(x, roadY(z) + 30, z);
      m.rotation.y = i;
      this.scene.add(m);
    }
  }
  rocks() {
    const geo = new T.IcosahedronGeometry(1, 0),
      o = new T.Object3D();
    const rocks = new T.InstancedMesh(geo, palette.rock, 240);
    for (let i = 0; i < 240; i++) {
      const z = ((i * 31.719) % 690) - 20,
        side = i % 2 ? 1 : -1;
      const x = roadX(z) + side * (12 + ((i * 17.3) % 70)),
        s = 1.5 + (i % 6) * 0.65,
        y = height(x, z);
      o.position.set(x, y + s * 0.3, z);
      o.scale.set(s, s * 0.85, s * 1.2);
      o.rotation.set(i * 0.2, i * 0.8, 0);
      o.updateMatrix();
      rocks.setMatrixAt(i, o.matrix);
      if (Math.abs(x - roadX(z)) < 35)
        this.physics.createCollider(R.ColliderDesc.ball(s * 0.8).setTranslation(x, y + s * 0.3, z));
    }
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    this.scene.add(rocks);
    for (let i = 0; i < 20; i++) {
      const z = 82 + i * 3.2 + (i > 8 ? 92 : 0),
        x = roadX(z) + Math.sin(i * 4) * 5,
        s = 0.45 + (i % 3) * 0.18;
      this.boulder(x, z, s, false);
    }
    for (let i = 0; i < 8; i++)
      this.boulder(roadX(220 + i * 4) + (i % 2 ? 4 : -4), 220 + i * 4, 0.9, true);
  }
  boulder(x: number, z: number, r: number, dynamic: boolean) {
    const y = height(x, z) + r;
    const m = new T.Mesh(new T.IcosahedronGeometry(r, 1), palette.rock);
    m.position.set(x, y, z);
    m.userData.home = { x, y, z };
    m.castShadow = true;
    this.scene.add(m);
    const body = this.physics.createRigidBody(
      (dynamic ? R.RigidBodyDesc.dynamic() : R.RigidBodyDesc.fixed()).setTranslation(x, y, z),
    );
    this.physics.createCollider(
      R.ColliderDesc.ball(r * 0.9)
        .setDensity(70)
        .setFriction(0.8),
      body,
    );
    if (dynamic) this.dynamics.push({ body, mesh: m });
    return body;
  }
  landmarks() {
    for (const [i, z] of campZ.entries()) {
      const x = roadX(z),
        y = height(x, z);
      const camp = new T.Group();
      camp.position.set(x, y, z);
      this.scene.add(camp);
      this.camps.push(camp);
      for (const side of [-1, 1]) {
        box(camp, [0.18, 6, 0.18], [side * 7, 3, 0], palette.iron);
        const flag = box(camp, [2.6, 1.3, 0.07], [side * 5.7, 5, 0], palette.orange);
        flag.rotation.z = -0.08 * side;
        box(camp, [0.5, 0.4, 0.5], [side * 7, 6, 0], palette.glow);
        this.anchors.push(new T.Vector3(x + side * 7, y + 3, z));
      }
      box(camp, [14, 0.15, 0.55], [0, 0.14, 0], palette.cream);
      const tent = new T.Mesh(new T.ConeGeometry(3.3, 3, 4), mat('#bca469'));
      tent.rotation.y = Math.PI / 4;
      tent.position.set(-13, 1.5, 1);
      camp.add(tent);
      box(camp, [1.4, 1, 1], [-10, 0.5, -2], palette.orange);
      this.label(
        `${i === 5 ? 'SUMMIT' : i === 0 ? 'BASECAMP' : 'CAMP 0' + i}`,
        new T.Vector3(x - 11, y + 3.5, z),
        true,
      );
    }
    // Independent timber slabs collapse after the truck crosses them.
    for (let i = 0; i < 13; i++) {
      const z = 322 + i * 1.8,
        x = roadX(z),
        y = roadY(z);
      const mesh = box(this.scene, [12, 0.32, 1.65], [x, y, z], palette.wood);
      mesh.userData.homeZ = z;
      const body = this.physics.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z));
      this.physics.createCollider(
        R.ColliderDesc.cuboid(6, 0.16, 0.825).setDensity(25).setFriction(0.9),
        body,
      );
      this.dynamics.push({ mesh, body, bridge: true });
    }
    for (let side of [-1, 1])
      for (let z = 319; z < 348; z += 5) {
        const x = roadX(z) + side * 6.2,
          y = roadY(z);
        box(this.scene, [0.2, 2, 0.2], [x, y + 1, z], palette.wood);
      }
    this.label('BROKEN CROSSING  /  EAST BYPASS →', new T.Vector3(roadX(312), roadY(312) + 4, 312));
    const mz = 512,
      mx = roadX(mz) - 15,
      my = height(mx, mz);
    this.staticBox([12, 7, 9], [mx, my + 3.5, mz], palette.wood);
    const roof = this.staticBox([14, 0.6, 11], [mx, my + 7.3, mz], palette.iron);
    roof.rotation.z = 0.09;
    this.staticBox([3, 4, 0.2], [mx, my + 2, mz - 4.6], mat('#1e2a28'));
    for (let j = 0; j < 4; j++) {
      const z = 494 + j * 4;
      this.staticBox([4, 0.15, 0.3], [mx, height(mx, z) + 0.2, z]);
    }
    for (let side of [-1, 1])
      this.staticBox([0.14, 0.2, 24], [mx + side * 1.1, height(mx, 490) + 0.25, 490], palette.iron);
    this.label('COPPERLINE  /  MINE 04', new T.Vector3(mx, my + 8, mz - 5));
    // Hidden cave: a stone arch, waterfall, and a recoverable prototype relic.
    const cz = 472,
      cx = branchX(cz) + 9,
      cy = height(cx, cz);
    for (const side of [-1, 1])
      this.staticBox([3, 8, 8], [cx + side * 4, cy + 4, cz], palette.rock);
    this.staticBox([11, 3, 8], [cx, cy + 8, cz], palette.rock);
    this.staticBox([9, 7, 0.6], [cx, cy + 3.5, cz + 4], mat('#162a2a'));
    box(this.scene, [3, 1, 4.5], [cx, cy + 0.7, cz], mat('#665e45'));
    for (let i = 0; i < 4; i++) {
      const wheel = new T.Mesh(new T.CylinderGeometry(1, 1, 0.6, 12), palette.iron);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(cx + (i % 2 ? 1.6 : -1.6), cy + 0.6, cz + (i < 2 ? -1.4 : 1.4));
      this.scene.add(wheel);
    }
    const waterfall = new T.Mesh(
      new T.PlaneGeometry(9, 13),
      mat('#8bbbb9', { transparent: true, opacity: 0.38, side: T.DoubleSide, roughness: 0.1 }),
    );
    waterfall.position.set(cx, cy + 5, cz - 4.3);
    this.scene.add(waterfall);
    const sz = 654,
      sx = roadX(sz) + 12,
      sy = height(sx, sz);
    for (const side of [-1, 1]) {
      pole(
        this.scene,
        new T.Vector3(sx + side * 3, sy, sz),
        new T.Vector3(sx, sy + 18, sz),
        0.2,
        palette.iron,
      );
    }
    for (let j = 0; j < 5; j++)
      box(this.scene, [6 - j, 0.15, 0.2], [sx, sy + j * 3, sz], palette.iron);
    const dish = new T.Mesh(
      new T.SphereGeometry(3, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.4),
      palette.cream,
    );
    dish.position.set(sx, sy + 15, sz);
    dish.rotation.x = 1;
    this.scene.add(dish);
    box(this.scene, [0.7, 0.7, 0.7], [sx, sy + 19, sz], palette.glow);
    // Abandoned expedition truck and trail warning boards.
    const ax = roadX(292) - 12,
      ay = height(ax, 292);
    box(this.scene, [3, 1.5, 5], [ax, ay + 1, 292], mat('#885e46'));
    box(this.scene, [2.8, 1.3, 2], [ax, ay + 2.2, 293], palette.iron);
    for (let z = 45; z < 650; z += 45) {
      const x = roadX(z) + 8,
        y = height(x, z);
      box(this.scene, [0.15, 2.3, 0.15], [x, y + 1.15, z], palette.wood);
      box(this.scene, [1.4, 0.8, 0.1], [x, y + 2, z], palette.orange);
    }
  }
  label(text: string, pos: T.Vector3, large = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const c = canvas.getContext('2d')!;
    c.fillStyle = '#122a28';
    c.fillRect(0, 0, 1024, 128);
    c.strokeStyle = '#d8bd82';
    c.strokeRect(4, 4, 1016, 120);
    c.fillStyle = '#eee3c7';
    c.font = 'bold 42px sans-serif';
    c.textAlign = 'center';
    c.fillText(text, 512, 80);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(canvas) }));
    sp.userData.campLabel = large;
    sp.position.copy(pos);
    sp.scale.set(large ? 5 : 8, large ? 0.65 : 1, 1);
    this.scene.add(sp);
  }
  update(dt: number, p: T.Vector3) {
    this.time += dt;
    this.water.position.y = roadY(379) - 0.4 + Math.sin(this.time) * 0.04;
    if (!this.rockslide && p.z > 209 && p.z < 217) {
      this.rockslide = true;
      for (let i = 0; i < 3; i++) {
        const b = this.boulder(roadX(222) + 10 + i * 2, 222 + i * 3, 0.85, true);
        b.applyImpulse({ x: -600, y: 0, z: -70 }, true);
        this.dynamics[this.dynamics.length - 1].mesh.userData.rockslide = true;
      }
    }
    for (const d of this.dynamics) {
      if (
        d.bridge &&
        !d.triggered &&
        Math.abs(p.z - d.mesh.position.z) < 2 &&
        Math.abs(p.x - d.mesh.position.x) < 6 &&
        p.y < d.mesh.position.y + 5
      )
        d.triggered = this.time;
      if (d.triggered && this.time - d.triggered > 0.65 && d.body.isFixed())
        d.body.setBodyType(R.RigidBodyType.Dynamic, true);
      d.mesh.position.copy(d.body.translation());
      d.mesh.quaternion.copy(d.body.rotation());
    }
  }
  resetBridge() {
    for (const d of this.dynamics)
      if (d.bridge) {
        const z = d.mesh.userData.homeZ ?? d.mesh.position.z;
        d.mesh.userData.homeZ = z;
        d.body.setBodyType(R.RigidBodyType.Fixed, true);
        d.body.setTranslation({ x: roadX(z), y: roadY(z), z }, true);
        d.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
        d.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        d.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        d.triggered = undefined;
      }
  }
  restart() {
    this.resetBridge();
    this.rockslide = false;
    for (const d of [...this.dynamics]) {
      if (d.bridge) continue;
      if (d.mesh.userData.rockslide) {
        this.physics.removeRigidBody(d.body);
        this.scene.remove(d.mesh);
        (d.mesh as T.Mesh).geometry.dispose();
        this.dynamics.splice(this.dynamics.indexOf(d), 1);
      } else {
        d.body.setTranslation(d.mesh.userData.home, true);
        d.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        d.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        d.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      }
    }
  }
}
