import * as T from 'three';
import R from '@dimforge/rapier3d-compat';
import { truckModel } from './TruckModel';
import { height, roadX, routeHeading, surface } from '../world/Terrain';
export type Input = {
  throttle: number;
  steer: number;
  brake: boolean;
  boost: boolean;
  winch: boolean;
};
export class Vehicle {
  body: R.RigidBody;
  controller: R.DynamicRayCastVehicleController;
  model = truckModel();
  health = 100;
  boost = 100;
  heat = 0;
  engine = 0;
  tires = 0;
  suspension = 0;
  speed = 0;
  steering = 0;
  grounded = 0;
  boosting = false;
  impact = 0;
  anchor: T.Vector3 | null = null;
  winchLine: T.Line;
  lastGrounded = 0;
  fallSpeed = 0;
  lastVelocity = new T.Vector3();
  position = new T.Vector3();
  quaternion = new T.Quaternion();
  terrain = 'dirt';
  readonly offsets = [
    new T.Vector3(-1.62, 0, 1.8),
    new T.Vector3(1.62, 0, 1.8),
    new T.Vector3(-1.62, 0, -1.8),
    new T.Vector3(1.62, 0, -1.8),
  ];
  constructor(
    public world: R.World,
    scene: T.Scene,
  ) {
    this.body = world.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(0, 7, 12)
        .setLinearDamping(0.12)
        .setAngularDamping(1.5)
        .setCcdEnabled(true),
    );
    world.createCollider(
      R.ColliderDesc.cuboid(1.25, 0.45, 2.5)
        .setTranslation(0, 0, 0)
        .setMass(950)
        .setFriction(0.45)
        .setRestitution(0.05),
      this.body,
    );
    world.createCollider(
      R.ColliderDesc.cuboid(1.1, 0.65, 1).setTranslation(0, 1.2, 0).setMass(35),
      this.body,
    );
    this.controller = world.createVehicleController(this.body);
    this.controller.indexUpAxis = 1;
    this.controller.setIndexForwardAxis = 2;
    this.offsets.forEach((p, i) => {
      this.controller.addWheel(p, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, 0.9, 1.06);
      this.controller.setWheelSuspensionStiffness(i, 34);
      this.controller.setWheelSuspensionCompression(i, 4.5);
      this.controller.setWheelSuspensionRelaxation(i, 5);
      this.controller.setWheelMaxSuspensionTravel(i, 0.55);
      this.controller.setWheelMaxSuspensionForce(i, 35000);
      this.controller.setWheelFrictionSlip(i, 3);
      this.controller.setWheelSideFrictionStiffness(i, 0.8);
    });
    scene.add(this.model.group);
    this.winchLine = new T.Line(
      new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]),
      new T.LineBasicMaterial({ color: '#f2d496' }),
    );
    scene.add(this.winchLine);
    this.reset(12);
  }
  reset(z: number, x = roadX(z), yaw = routeHeading(z)) {
    this.body.setTranslation({ x, y: height(x, z) + 2.7, z }, true);
    this.body.setRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), yaw), true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.lastVelocity.set(0, 0, 0);
    this.lastGrounded = 0;
    this.fallSpeed = 0;
    this.health = Math.max(60, this.health);
    this.anchor = null;
    this.sync();
  }
  preStep(dt: number, input: Input, anchors: T.Vector3[]) {
    this.position.copy(this.body.translation());
    this.quaternion.copy(this.body.rotation());
    const velocity = new T.Vector3().copy(this.body.linvel());
    const forward = new T.Vector3(0, 0, 1).applyQuaternion(this.quaternion);
    this.speed = velocity.dot(forward);
    this.terrain = surface(this.position.x, this.position.z);
    this.boosting = input.boost && input.throttle > 0 && this.boost > 1 && this.heat < 98;
    this.boost = T.MathUtils.clamp(this.boost + (this.boosting ? -22 : 5) * dt, 0, 100);
    this.heat = T.MathUtils.clamp(this.heat + (this.boosting ? 20 : -11) * dt, 0, 100);
    const grip =
      this.terrain === 'mud'
        ? 0.8 + this.tires * 0.35
        : this.terrain === 'water'
          ? 1.6
          : 3 + this.tires * 0.4;
    this.steering = T.MathUtils.damp(
      this.steering,
      input.steer * (0.48 - Math.min(Math.abs(this.speed) / 90, 0.2)),
      8,
      dt,
    );
    const reverseBrake = input.throttle < 0 && this.speed > 1.5;
    let force =
      input.throttle *
      (2500 + this.engine * 650) *
      (this.boosting ? 1.8 : 1) *
      (this.health < 25 ? 0.65 : 1);
    if (reverseBrake || Math.abs(this.speed) > 28 + (this.boosting ? 12 : 0)) force = 0;
    for (let i = 0; i < 4; i++) {
      this.controller.setWheelEngineForce(i, force);
      this.controller.setWheelSteering(i, i < 2 ? this.steering : 0);
      this.controller.setWheelBrake(
        i,
        input.brake
          ? i > 1
            ? 220
            : 80
          : reverseBrake
            ? 120
            : input.throttle === 0 && !input.winch
              ? 25
              : 0,
      );
      this.controller.setWheelFrictionSlip(i, grip);
      this.controller.setWheelSideFrictionStiffness(i, input.brake ? 0.28 : 0.8);
      this.controller.setWheelSuspensionStiffness(i, 34 + this.suspension * 4);
    }
    this.controller.updateVehicle(dt);
    this.grounded = this.offsets.filter((_, i) => this.controller.wheelIsInContact(i)).length;
    // Mild anti-roll torque preserves dramatic movement without easy high-speed rollovers.
    if (this.grounded >= 2) {
      const up = new T.Vector3(0, 1, 0).applyQuaternion(this.quaternion);
      this.body.applyTorqueImpulse({ x: up.z * 230 * dt, y: 0, z: -up.x * 230 * dt }, true);
    }
    if (this.terrain === 'mud' && this.grounded)
      this.body.applyImpulse(velocity.clone().multiplyScalar(-180 * dt), true);
    if (this.terrain === 'water' && this.grounded)
      this.body.applyImpulse({ x: 220 * dt, y: 0, z: -120 * dt }, true);
    if (input.winch) {
      if (!this.anchor) {
        this.anchor =
          anchors
            .filter((a) => a.distanceTo(this.position) < 24 && a.y > this.position.y - 3)
            .sort((a, b) => b.z - a.z)[0] ?? null;
      }
      if (this.anchor) {
        const delta = this.anchor.clone().sub(this.position);
        if (delta.length() > 30 || delta.length() < 3) this.anchor = null;
        else this.body.applyImpulse(delta.normalize().multiplyScalar(6500 * dt), true);
      }
    } else this.anchor = null;
  }
  postStep() {
    const velocity = new T.Vector3().copy(this.body.linvel());
    this.impact = Math.max(0, velocity.distanceTo(this.lastVelocity) - 4);
    if (this.impact > 3) this.health = Math.max(10, this.health - (this.impact - 3) * 1.2);
    if (this.grounded === 0) this.fallSpeed = Math.min(this.fallSpeed, velocity.y);
    if (this.grounded > 0 && this.lastGrounded === 0) {
      const landing = Math.max(0, -this.fallSpeed - 10);
      this.health = Math.max(10, this.health - (landing * 2) / (1 + this.suspension * 0.25));
      this.impact = Math.max(this.impact, landing);
      this.fallSpeed = 0;
    }
    this.lastGrounded = this.grounded;
    this.lastVelocity.copy(velocity);
    this.sync();
  }
  sync() {
    this.position.copy(this.body.translation());
    this.quaternion.copy(this.body.rotation());
    this.model.group.position.copy(this.position);
    this.model.group.quaternion.copy(this.quaternion);
    this.model.wheels.forEach((w, i) => {
      const p = this.offsets[i];
      const length = this.controller.wheelSuspensionLength(i) ?? 0.9;
      w.position.copy(p);
      w.position.y -= length;
      w.rotation.y = i < 2 ? this.steering : 0;
      (w.userData.spin as T.Group).rotation.x = -(this.controller.wheelRotation(i) ?? 0);
      const spring = this.model.springs[i];
      spring.position.copy(p);
      spring.position.y -= length * 0.5;
      spring.scale.y = Math.max(0.1, length);
    });
    this.winchLine.visible = !!this.anchor;
    if (this.anchor) {
      const a = this.winchLine.geometry.getAttribute('position');
      a.setXYZ(0, this.position.x, this.position.y + 0.5, this.position.z);
      a.setXYZ(1, this.anchor.x, this.anchor.y, this.anchor.z);
      a.needsUpdate = true;
      this.winchLine.geometry.computeBoundingSphere();
    }
  }
}
