import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
/** Merge compatible static meshes by material. Dynamic objects keep their own transforms. */
export function batchStatic(parent: T.Object3D, exclude = new Set<T.Object3D>()) {
  const groups = new Map<T.Material, T.Mesh[]>();
  for (const child of parent.children) {
    if (
      !(child instanceof T.Mesh) ||
      child instanceof T.InstancedMesh ||
      exclude.has(child) ||
      Array.isArray(child.material) ||
      child.geometry.type !== 'BoxGeometry'
    )
      continue;
    const list = groups.get(child.material) ?? [];
    list.push(child);
    groups.set(child.material, list);
  }
  for (const [material, meshes] of groups) {
    if (meshes.length < 2) continue;
    const geometries = meshes.map((m) => {
      m.updateMatrix();
      return m.geometry.clone().applyMatrix4(m.matrix);
    });
    const geometry = mergeGeometries(geometries);
    geometries.forEach((g) => g.dispose());
    if (!geometry) continue;
    const merged = new T.Mesh(geometry, material);
    merged.castShadow = true;
    merged.receiveShadow = true;
    parent.add(merged);
    for (const m of meshes) {
      parent.remove(m);
      m.geometry.dispose();
    }
  }
}
