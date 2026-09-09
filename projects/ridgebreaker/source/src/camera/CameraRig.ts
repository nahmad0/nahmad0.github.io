import * as T from 'three';
import R from '@dimforge/rapier3d-compat';
import { Vehicle } from '../vehicle/Vehicle';
import { height } from '../world/Terrain';
export class CameraRig {
  mode = 0;
  names = ['Chase', 'Cinematic', 'Hood', 'Side', 'Orbit'];
  time = 0;
  look = new T.Vector3();
  initialized = false;
  constructor(
    public camera: T.PerspectiveCamera,
    public world: R.World,
  ) {}
  update(dt: number, v: Vehicle, menu = false) {
    this.time += dt;
    const p = v.position,
      q = v.quaternion;
    const speed = Math.abs(v.speed);
    const forward = new T.Vector3(0, 0, 1).applyQuaternion(q);
    forward.y = 0;
    forward.normalize();
    const side = new T.Vector3(forward.z, 0, -forward.x);
    let desired = p.clone();
    let target = p.clone().add(new T.Vector3(0, 1, 0));
    if (menu) {
      desired
        .addScaledVector(side, -12)
        .addScaledVector(forward, -12)
        .add(new T.Vector3(0, 5, 0));
      target.addScaledVector(side, 8).addScaledVector(forward, 2);
    } else if (this.mode === 2) {
      desired.add(new T.Vector3(0, 1.9, 1.25).applyQuaternion(q));
      target = desired.clone().add(new T.Vector3(0, 0, 20).applyQuaternion(q));
    } else if (this.mode === 3) {
      desired.addScaledVector(side, 13).add(new T.Vector3(0, 5, 0));
    } else if (this.mode === 4) {
      desired.add(new T.Vector3(Math.sin(this.time * 0.2) * 15, 7, Math.cos(this.time * 0.2) * 15));
    } else {
      desired
        .addScaledVector(forward, -(10 + Math.min(speed * 0.2, 6) + (this.mode === 1 ? 4 : 0)))
        .add(new T.Vector3(0, this.mode === 1 ? 7 : 5, 0));
      if (this.mode === 1) desired.addScaledVector(side, 4);
      target.addScaledVector(forward, 3);
    }
    if (this.mode !== 2 || menu) {
      desired.y = Math.max(desired.y, height(desired.x, desired.z) + 2);
      const delta = desired.clone().sub(target),
        len = delta.length();
      const ray = new R.Ray(target, delta.normalize());
      const hit = this.world.castRay(ray, len, true, undefined, undefined, undefined, v.body);
      if (hit && hit.timeOfImpact > 1)
        desired.copy(target).addScaledVector(delta, Math.max(1, hit.timeOfImpact - 0.65));
    }
    const alpha = this.initialized ? 1 - Math.exp(-(this.mode === 2 ? 20 : 5) * dt) : 1;
    this.camera.position.lerp(desired, alpha);
    this.camera.position.y = Math.max(
      this.camera.position.y,
      height(this.camera.position.x, this.camera.position.z) + 0.75,
    );
    this.look.lerp(target, alpha);
    this.camera.lookAt(this.look);
    this.camera.fov = T.MathUtils.damp(this.camera.fov, v.boosting ? 68 : 60, 3, dt);
    this.camera.updateProjectionMatrix();
    this.initialized = true;
  }
}
