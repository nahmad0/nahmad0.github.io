import * as T from 'three';
import R from '@dimforge/rapier3d-compat';
import { terrain, campZ, height, roadX } from '../world/Terrain';
import { World } from '../world/World';
import { Vehicle, type Input } from '../vehicle/Vehicle';
import { CameraRig } from '../camera/CameraRig';
import { Controls } from './Input';
import { Expedition } from '../gameplay/Expedition';
import { UI } from '../ui/UI';
import { Effects } from '../effects/Effects';
import { AudioManager } from '../audio/AudioManager';
export class Game {
  scene = new T.Scene();
  renderer: T.WebGLRenderer;
  camera = new T.PerspectiveCamera(60, innerWidth / innerHeight, 0.15, 1000);
  physics: R.World;
  vehicle: Vehicle;
  world: World;
  rig: CameraRig;
  controls = new Controls();
  expedition: Expedition;
  effects: Effects;
  audio = new AudioManager();
  active = false;
  started = false;
  ui = new UI();
  last = 0;
  accumulator = 0;
  sun: T.DirectionalLight;
  override: Input | null = null;
  frames = 0;
  fps = 60;
  clock = 0;
  quality = 'high';
  constructor() {
    this.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    document.getElementById('viewport')!.appendChild(this.renderer.domElement);
    this.scene.background = new T.Color('#abc5be');
    this.scene.fog = new T.FogExp2('#abc5be', 0.0037);
    this.scene.add(new T.HemisphereLight('#d5eeef', '#67785a', 2.4));
    this.sun = new T.DirectionalLight('#ffe2ad', 3.4);
    this.sun.position.set(-70, 100, 50);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -65,
      right: 65,
      top: 65,
      bottom: -65,
      near: 1,
      far: 260,
    });
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.12;
    this.scene.add(this.sun, this.sun.target);
    this.physics = new R.World({ x: 0, y: -16, z: 0 });
    this.physics.timestep = 1 / 60;
    terrain(this.scene, this.physics);
    this.world = new World(this.scene, this.physics);
    this.vehicle = new Vehicle(this.physics, this.scene);
    this.physics.step();
    this.rig = new CameraRig(this.camera, this.physics);
    this.expedition = new Expedition(this.scene);
    this.effects = new Effects(this.scene);
    this.ui.on('start', () => this.start(false));
    this.ui.on('continue', () => this.start(true));
    this.ui.on('controls', () => this.ui.controls());
    this.ui.on('settings', () => this.settings());
    this.ui.on('pause', () => this.pause());
    this.ui.dialog.addEventListener('close', () => {
      if (this.started && this.ui.menu.hidden) this.resume();
    });
    this.ui.dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.controls.pressed.delete('Escape');
      this.ui.close();
    });
    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.active) this.pause();
    });
    // Dev-only instrumentation for reproducible real-physics browser acceptance tests.
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('test'))
      (window as unknown as { __game: Game }).__game = this;
    this.ui.ready(!!this.expedition.read());
    requestAnimationFrame((t) => this.frame(t));
  }
  start(continuing: boolean) {
    this.expedition.start(this.vehicle, continuing);
    this.world.restart();
    this.started = true;
    this.active = true;
    this.controls.enabled = true;
    this.controls.clear();
    this.ui.playing(true);
    this.audio.start();
    this.rig.initialized = false;
    this.expedition.message(
      'EXPEDITION STARTED · Follow the orange flags. Explore the side trails.',
    );
  }
  resume() {
    this.active = true;
    this.controls.enabled = true;
    this.controls.clear();
    this.accumulator = 0;
  }
  finish() {
    this.active = false;
    this.controls.enabled = false;
    const minutes = Math.floor(this.expedition.seconds / 60),
      seconds = Math.floor(this.expedition.seconds % 60);
    this.ui.panel(
      'You broke the ridge.',
      `<span class="eyebrow">SUMMIT SECURED / EXPEDITION COMPLETE</span><p>Every broken crossing. Every impossible climb.<br>The Forgotten Ridge is yours.</p><div class="upgrade"><span>EXPEDITION TIME</span><strong>${minutes}:${String(seconds).padStart(2, '0')}</strong></div><div class="upgrade"><span>SALVAGE RECOVERED</span><strong>${this.expedition.collected.size} / ${this.expedition.items.length}</strong></div><div class="upgrade"><span>VEHICLE INTEGRITY</span><strong>${Math.round(this.vehicle.health)}%</strong></div><button class="action" id="explore">KEEP EXPLORING</button>`,
    );
    this.ui.dialog.querySelector('#explore')!.addEventListener('click', () => this.ui.close());
  }
  pause() {
    if (!this.started) return;
    this.active = false;
    this.controls.enabled = false;
    this.controls.clear();
    this.ui.panel(
      'Take a breather.',
      `<button class="action" id="resume">RESUME EXPEDITION</button><button class="action secondary" id="pause-settings">SETTINGS</button><button class="action secondary" id="pause-controls">CONTROLS</button><button class="action secondary" id="quit">SAVE & RETURN TO BASE</button>`,
    );
    this.ui.dialog.querySelector('#resume')!.addEventListener('click', () => {
      this.ui.close();
      this.resume();
    });
    this.ui.dialog
      .querySelector('#pause-settings')!
      .addEventListener('click', () => this.settings());
    this.ui.dialog
      .querySelector('#pause-controls')!
      .addEventListener('click', () => this.ui.controls());
    this.ui.dialog.querySelector('#quit')!.addEventListener('click', () => {
      this.expedition.save(this.vehicle);
      this.started = false;
      this.active = false;
      this.ui.close();
      this.ui.playing(false);
      (document.getElementById('continue') as HTMLButtonElement).disabled = false;
    });
  }
  settings() {
    this.ui.panel(
      'Tune the experience.',
      `<label>Master volume <input id="volume" aria-label="Master volume" type="range" min="0" max="100" value="${this.audio.volume * 100}"></label><label>Graphics <select id="quality"><option value="high">High</option><option value="low">Performance</option></select></label><label>Mountain rain <input id="rain" type="checkbox" ${this.effects.rainEnabled ? 'checked' : ''}></label><p>Progress saves at camps, after salvage, and after upgrades. Recovery returns you to your most recent camp.</p>`,
    );
    (document.getElementById('quality') as HTMLSelectElement).value = this.quality;
    document
      .getElementById('volume')!
      .addEventListener('input', (e) =>
        this.audio.setVolume(Number((e.target as HTMLInputElement).value) / 100),
      );
    document.getElementById('quality')!.addEventListener('change', (e) => {
      this.quality = (e.target as HTMLSelectElement).value;
      this.renderer.setPixelRatio(this.quality === 'low' ? 1 : Math.min(devicePixelRatio, 1.6));
      this.renderer.shadowMap.enabled = this.quality !== 'low';
      this.renderer.setSize(innerWidth, innerHeight);
    });
    document.getElementById('rain')!.addEventListener('change', (e) => {
      this.effects.rainEnabled = (e.target as HTMLInputElement).checked;
      (this.scene.fog as T.FogExp2).density = this.effects.rainEnabled ? 0.007 : 0.0037;
    });
  }
  upgrades() {
    this.active = false;
    this.controls.enabled = false;
    const show = () => {
      const values = [this.vehicle.engine, this.vehicle.tires, this.vehicle.suspension];
      this.ui.panel(
        'Build a better beast.',
        `<p>${this.expedition.parts} salvaged parts available. Install upgrades within 18 m of your current camp.</p>${['Engine torque', 'All-terrain tires', 'Long-travel suspension'].map((name, i) => `<div class="upgrade"><div>${name}<small>LEVEL ${values[i]} / 3</small></div><button data-upgrade="${i}">${values[i] >= 3 ? 'MAX' : 3 + values[i] * 2 + ' PARTS'}</button></div>`).join('')}<p id="upgrade-result"></p>`,
      );
      this.ui.dialog.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach((b) =>
        b.addEventListener('click', () => {
          this.expedition.upgrade(Number(b.dataset.upgrade), this.vehicle);
          show();
          document.getElementById('upgrade-result')!.textContent = this.expedition.notification;
        }),
      );
    };
    show();
  }
  step(dt: number, input: Input) {
    this.vehicle.preStep(dt, input, this.world.anchors);
    this.physics.step();
    this.vehicle.postStep();
    if (this.vehicle.impact > 4) this.audio.impact(this.vehicle.impact);
    this.world.update(dt, this.vehicle.position);
    const old = this.expedition.camp,
      col = this.expedition.collected.size;
    this.expedition.update(dt, this.vehicle);
    if (old !== this.expedition.camp || col !== this.expedition.collected.size) this.audio.chime();
    if (old !== 5 && this.expedition.won) this.finish();
    if (
      this.vehicle.position.y < -60 ||
      Math.abs(this.vehicle.position.x) > 176 ||
      this.vehicle.position.z < -50 ||
      this.vehicle.position.z > 690
    ) {
      this.vehicle.reset(campZ[this.expedition.camp]);
      this.expedition.message('Recovered at camp · Stay inside the expedition boundary.');
    }
  }
  frame(time: number) {
    requestAnimationFrame((t) => this.frame(t));
    const dt = Math.min(0.08, (time - this.last) / 1000 || 0.016);
    this.last = time;
    this.fps = T.MathUtils.damp(this.fps, 1 / dt, 2, dt);
    this.frames++;
    if (this.controls.consume('Escape')) {
      if (this.ui.dialog.open) {
        this.ui.close();
        if (this.started) this.resume();
      } else if (this.active) this.pause();
    }
    if (this.active) {
      if (this.controls.consume('KeyR')) {
        this.vehicle.reset(campZ[this.expedition.camp]);
        this.world.resetBridge();
        this.expedition.message('RECOVERED · Last camp');
      }
      if (this.controls.consume('KeyC')) {
        this.rig.mode = (this.rig.mode + 1) % 5;
        this.expedition.message(this.rig.names[this.rig.mode].toUpperCase() + ' CAMERA');
      }
      if (this.controls.consume('KeyU')) this.upgrades();
    }
    if (this.active) {
      this.accumulator += dt;
      const input = this.override ?? this.controls.read();
      while (this.accumulator >= 1 / 60) {
        this.step(1 / 60, input);
        this.accumulator -= 1 / 60;
      }
      this.effects.update(dt, this.vehicle);
    } else if (!this.started) {
      this.vehicle.preStep(
        1 / 60,
        { throttle: 0, steer: 0, brake: true, boost: false, winch: false },
        [],
      );
      this.physics.step();
      this.vehicle.postStep();
    }
    this.world.camps.forEach((c) => (c.visible = this.started));
    for (const o of this.scene.children) if (o.userData.campLabel) o.visible = this.started;
    this.rig.update(dt, this.vehicle, !this.started);
    this.sun.position.copy(this.vehicle.position).add(new T.Vector3(-60, 90, 40));
    this.sun.target.position.copy(this.vehicle.position);
    this.audio.update(this.vehicle, this.active, this.effects.rainEnabled);
    if (this.frames % 3 === 0)
      this.ui.update(this.vehicle, this.expedition, this.rig.names[this.rig.mode]);
    this.renderer.render(this.scene, this.camera);
  }
  snapshot() {
    return {
      position: this.vehicle.position.toArray(),
      speed: this.vehicle.speed,
      grounded: this.vehicle.grounded,
      health: this.vehicle.health,
      boost: this.vehicle.boost,
      camp: this.expedition.camp,
      parts: this.expedition.parts,
      won: this.expedition.won,
      fps: this.fps,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      camera: this.camera.position.toArray(),
      cameraClearance:
        this.camera.position.y - height(this.camera.position.x, this.camera.position.z),
      suspension: this.vehicle.offsets.map((_, i) =>
        this.vehicle.controller.wheelSuspensionLength(i),
      ),
      road: roadX(this.vehicle.position.z),
    };
  }
}
