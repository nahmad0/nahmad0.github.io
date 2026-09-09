import * as T from 'three';
import { box, mat, palette } from '../world/World';
import { batchStatic } from '../assets/GeometryBatch';
export function truckModel() {
  const group = new T.Group(),
    body = new T.Group();
  group.add(body);
  const paint = mat('#d97138', { metalness: 0.24, roughness: 0.48 }),
    dark = mat('#202e30', { metalness: 0.3 }),
    glass = mat('#456976', { metalness: 0.6, roughness: 0.12 }),
    rubber = mat('#202627');
  box(body, [2.6, 0.7, 5.2], [0, 0.35, 0], paint);
  box(body, [2.35, 0.45, 2], [0, 0.75, 1.55], paint);
  box(body, [2.25, 1.35, 2.25], [0, 1.3, -0.1], paint);
  box(body, [2.4, 0.18, 2.5], [0, 2, -0.1], paint);
  const windshield = box(body, [2.05, 0.92, 0.08], [0, 1.43, 1.05], glass);
  windshield.rotation.x = -0.1;
  box(body, [1.8, 0.8, 0.08], [0, 1.4, -1.25], glass);
  for (const s of [-1, 1]) {
    box(body, [0.06, 0.85, 1.65], [s * 1.14, 1.45, -0.1], glass);
    box(body, [0.09, 1.1, 0.1], [s * 1.18, 1.4, 0.02], paint);
    box(body, [0.12, 0.45, 1.3], [s * 1.33, 0.22, -1.8], paint);
    box(body, [0.12, 0.45, 1.4], [s * 1.33, 0.22, 1.75], paint);
    box(body, [0.18, 0.12, 0.5], [s * 1.23, 0.9, -0.55], dark);
    box(body, [0.25, 0.28, 0.4], [s * 1.52, 1.35, 0.6], dark);
    box(
      body,
      [0.65, 0.25, 0.12],
      [s * 0.8, 0.64, 2.64],
      mat('#ffedbd', { emissive: '#ffe1a0', emissiveIntensity: 1.4 }),
    );
    box(
      body,
      [0.4, 0.2, 0.1],
      [s * 0.95, 0.5, -2.64],
      mat('#a7432d', { emissive: '#a7432d', emissiveIntensity: 0.4 }),
    );
  }
  box(body, [2.9, 0.24, 0.3], [0, -0.1, 2.8], palette.iron);
  box(body, [2.8, 0.24, 0.3], [0, -0.1, -2.75], palette.iron);
  box(body, [1.1, 0.35, 0.1], [0, 0.45, 2.66], dark);
  for (let i = 0; i < 6; i++)
    box(body, [0.06, 0.28, 0.05], [-0.46 + i * 0.18, 0.45, 2.73], palette.cream);
  box(body, [2.15, 0.1, 1.1], [0, 0.77, -1.95], dark);
  box(body, [2.1, 0.14, 1.5], [0, 2.2, -0.1], dark);
  for (let i = 0; i < 4; i++)
    box(
      body,
      [0.3, 0.22, 0.2],
      [-0.75 + i * 0.5, 2.34, 0.68],
      mat('#fff0c5', { emissive: '#ffcc74', emissiveIntensity: 1 }),
    );
  // Readable original expedition insignia.
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#e0caa0';
  ctx.font = '900 82px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('07', 128, 90);
  const decal = new T.Mesh(
    new T.PlaneGeometry(0.8, 0.4),
    new T.MeshBasicMaterial({ map: new T.CanvasTexture(canvas), transparent: true }),
  );
  decal.position.set(1.19, 0.54, -0.25);
  decal.rotation.y = Math.PI / 2;
  body.add(decal);
  const wheels: T.Group[] = [],
    springs: T.Mesh[] = [];
  const tireGeo = new T.CylinderGeometry(1.04, 1.04, 0.75, 20);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new T.CylinderGeometry(0.48, 0.48, 0.79, 12);
  rimGeo.rotateZ(Math.PI / 2);
  const treadGeo = new T.BoxGeometry(0.85, 0.15, 0.3),
    treads = new T.InstancedMesh(treadGeo, rubber, 24),
    o = new T.Object3D();
  for (let j = 0; j < 24; j++) {
    const a = (j / 24) * Math.PI * 2;
    o.position.set(0, Math.cos(a) * 1.04, Math.sin(a) * 1.04);
    o.rotation.set(a, 0, j % 2 ? 0.16 : -0.16);
    o.updateMatrix();
    treads.setMatrixAt(j, o.matrix);
  }
  for (let i = 0; i < 4; i++) {
    const steer = new T.Group(),
      spin = new T.Group();
    steer.add(spin);
    group.add(steer);
    const tire = new T.Mesh(tireGeo, rubber),
      rim = new T.Mesh(rimGeo, palette.cream);
    spin.add(tire, rim, treads.clone());
    tire.castShadow = true;
    steer.userData.spin = spin;
    wheels.push(steer);
    const spring = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 1, 6), palette.orange);
    group.add(spring);
    springs.push(spring);
  }
  batchStatic(body);
  return { group, body, wheels, springs };
}
