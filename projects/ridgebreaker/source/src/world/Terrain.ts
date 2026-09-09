import * as T from 'three';
import R from '@dimforge/rapier3d-compat';
export const SUMMIT = 660;
export const stages = [
  'Forest trail',
  'Granite steps',
  'Blackwater mud',
  'Boulder run',
  'Knife-edge ledge',
  'Broken crossing',
  'River ford',
  'Switchback climb',
  'Old copper mine',
  'Final ascent',
  'The summit',
];
export const campZ = [12, 132, 272, 414, 542, 650];
export function roadX(z: number) {
  return 22 * Math.sin(z / 68) + 12 * Math.sin(z / 33);
}
export function roadY(z: number) {
  return 3 + Math.max(0, z) * 0.145 + 3 * Math.sin(z / 37) + (z > 460 ? (z - 460) * 0.14 : 0);
}
export function routeHeading(z: number) {
  return Math.atan2(roadX(z + 1) - roadX(z), 1);
}
export function branchX(z: number) {
  return (
    roadX(z) +
    (z > 165 && z < 260
      ? -24 * Math.sin(((z - 165) / 95) * Math.PI)
      : z > 445 && z < 535
        ? 30 * Math.sin(((z - 445) / 90) * Math.PI)
        : 0)
  );
}
export function surface(x: number, z: number) {
  const d = Math.abs(x - roadX(z));
  return z > 155 && z < 191 && d < 10 ? 'mud' : z > 368 && z < 390 && d < 16 ? 'water' : 'dirt';
}
export function height(x: number, z: number) {
  const d = Math.abs(x - roadX(z)),
    b = Math.abs(x - branchX(z));
  const ridge =
    roadY(z) + Math.sin(x * 0.065 + z * 0.023) * 10 + Math.sin(x * 0.12 - z * 0.035) * 4;
  const edge = T.MathUtils.smoothstep(Math.min(d, b), 7, 24);
  let h = T.MathUtils.lerp(roadY(z), ridge, edge);
  h += edge * (Math.pow(Math.abs(x) / 130, 1.5) * 48);
  const rough = Math.sin(z * 0.82) * 0.2 + Math.sin(z * 0.27 + x * 0.48) * 0.24;
  h += rough * (z > 75 ? 1 : 0.2) * (1 - edge);
  // A navigable longer bypass sits beside the genuine bridge ravine.
  if (z > 322 && z < 344 && d < 8) h -= Math.sin(((z - 322) / 22) * Math.PI) * 12;
  if (z > 296 && z < 357 && x > roadX(z) + 9 && x < roadX(z) + 23) h = roadY(z) + 0.2;
  if (z > 368 && z < 390 && d < 16) h -= Math.sin(((z - 368) / 22) * Math.PI) * 1.5;
  if (z > 472 && z < 485 && d < 7) h += (z - 472) * 0.22; // launch ramp, with open landing
  if (z > 279 && z < 307 && x < roadX(z) - 4)
    h -= Math.sin(((z - 279) / 28) * Math.PI) * Math.min(10, roadX(z) - 4 - x) * 2.5;
  return h;
}
export function terrain(scene: T.Scene, physics: R.World) {
  const nx = 180,
    nz = 380,
    minX = -180,
    minZ = -60,
    dx = 2,
    dz = 2;
  const pos: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const dirt = new T.Color('#a88960'),
    green = new T.Color('#667765'),
    rock = new T.Color('#899189');
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const x = minX + i * dx,
        z = minZ + j * dz,
        y = height(x, z);
      pos.push(x, y, z);
      const d = Math.min(Math.abs(x - roadX(z)), Math.abs(x - branchX(z)));
      const c = d < 7 ? dirt.clone() : green.clone().lerp(rock, T.MathUtils.smoothstep(y, 55, 155));
      if (surface(x, z) === 'mud') c.set('#574839');
      c.multiplyScalar(0.92 + 0.1 * Math.sin(x * 7 + z * 5));
      colors.push(c.r, c.g, c.b);
      if (i < nx && j < nz) {
        const a = j * (nx + 1) + i;
        indices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2);
      }
    }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const mesh = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mesh.receiveShadow = true;
  scene.add(mesh);
  physics.createCollider(
    R.ColliderDesc.trimesh(new Float32Array(pos), new Uint32Array(indices)).setFriction(0.85),
  );
  return mesh;
}
