import { Vehicle } from '../vehicle/Vehicle';
import { Expedition } from '../gameplay/Expedition';
import { campZ, roadX, stages, SUMMIT } from '../world/Terrain';
export class UI {
  root = document.getElementById('app')!;
  menu: HTMLElement;
  hud: HTMLElement;
  dialog: HTMLDialogElement;
  map: CanvasRenderingContext2D;
  constructor() {
    this.root.innerHTML = `<div id="viewport"></div><div id="loading"><span class="eyebrow">RIDGEBREAKER FIELD DIVISION</span><h2>Preparing the expedition…</h2><p>Loading terrain & vehicle physics</p></div>
  <main id="menu" hidden><header><a class="brand" href="#" aria-label="Ridgebreaker home"><span class="brandmark">R/</span> RIDGEBREAKER</a><span class="edition">EXPEDITION SERIES <b>001</b></span></header><div class="menu-content"><div class="eyebrow"><span class="line"></span> LEAVE THE ROAD BEHIND</div><h1>RIDGE<br>BREAKER<span>WILD ASCENT</span></h1><p class="intro">No roads. No easy way up.<br>Just four wheels and a mountain to conquer.</p><div class="menu-actions"><button class="primary" id="start">START EXPEDITION <span>↗</span></button><button id="continue">CONTINUE <span>→</span></button><div class="small-actions"><button id="settings">SETTINGS</button><button id="controls">CONTROLS <span>⌨</span></button></div></div></div><div class="location-card"><span class="eyebrow">YOUR NEXT FRONTIER</span><h2>The Forgotten Ridge</h2><p>Dense forest. Broken trails. One summit.</p><div><span>01 / 01</span><span class="pill">EXPLORATION · OFF-ROAD</span></div></div><footer><span><i class="status-dot"></i> BUILT FOR THE CLIMB</span><span>650 M OF WILDERNESS <b> / </b> 6 EXPEDITION CAMPS</span><span>07 — RIDGEBREAKER 4×4</span></footer></main>
  <section id="hud" hidden><div class="hud-top"><div><span class="eyebrow">THE FORGOTTEN RIDGE</span><h2 id="objective">Reach the next camp</h2><p id="stage"></p></div><button id="pause" aria-label="Pause game">Ⅱ <span>ESC</span></button></div><div id="toast" role="status"></div><div class="map-block"><canvas id="map" width="160" height="210"></canvas><div>TRAIL MAP <span>N ↑</span></div></div><div class="hud-bottom"><div class="speed"><strong id="speed">0</strong><span>KM/H<br><b id="gear">N</b></span></div><div class="gauges"><label>INTEGRITY <span id="health-value"></span></label><div class="bar"><i id="health-bar"></i></div><label>BOOST <span id="boost-value"></span></label><div class="bar boost"><i id="boost-bar"></i></div><p id="temperature"></p></div><div class="expedition-meta"><strong id="progress">CAMP 00 / 05</strong><p id="parts"></p><p id="camera-name"></p></div></div><div class="key-strip"><span><kbd>W A S D</kbd> DRIVE</span><span><kbd>SHIFT</kbd> BOOST</span><span><kbd>E</kbd> WINCH</span><span><kbd>R</kbd> RECOVER</span><span><kbd>U</kbd> UPGRADE</span><span><kbd>C</kbd> CAMERA</span></div></section><dialog id="dialog"></dialog>`;
    this.menu = this.root.querySelector('#menu')!;
    this.hud = this.root.querySelector('#hud')!;
    this.dialog = this.root.querySelector('dialog')!;
    this.map = (this.root.querySelector('#map') as HTMLCanvasElement).getContext('2d')!;
  }
  on(id: string, fn: () => void) {
    this.root.querySelector('#' + id)!.addEventListener('click', fn);
  }
  ready(hasSave: boolean) {
    this.root.querySelector('#loading')!.remove();
    this.menu.hidden = false;
    (this.root.querySelector('#continue') as HTMLButtonElement).disabled = !hasSave;
  }
  playing(value: boolean) {
    this.menu.hidden = value;
    this.hud.hidden = !value;
  }
  close() {
    this.dialog.close();
  }
  panel(title: string, body: string) {
    this.dialog.innerHTML = `<button id="close-dialog" class="close" aria-label="Close dialog">×</button><span class="eyebrow">RIDGEBREAKER / FIELD GUIDE</span><h2>${title}</h2>${body}`;
    this.dialog.querySelector('#close-dialog')!.addEventListener('click', () => this.close());
    if (!this.dialog.open) this.dialog.showModal();
  }
  controls() {
    this.panel(
      'Know your rig.',
      `<div class="control-grid"><kbd>W / ↑</kbd><span>Accelerate</span><kbd>S / ↓</kbd><span>Brake, then reverse</span><kbd>A D / ← →</kbd><span>Steer</span><kbd>SPACE</kbd><span>Handbrake</span><kbd>SHIFT</kbd><span>Boost torque</span><kbd>E (hold)</kbd><span>Winch to an uphill anchor</span><kbd>R</kbd><span>Recover at last camp</span><kbd>C</kbd><span>Cycle five cameras</span><kbd>U</kbd><span>Camp upgrades</span><kbd>ESC</kbd><span>Pause / resume</span></div><p>Controller: triggers drive, left stick steers, A brakes, B boosts, X winches. Feather the throttle over rocks; use momentum on climbs. Follow orange flags and consult the trail map.</p>`,
    );
  }
  update(v: Vehicle, e: Expedition, camera: string) {
    const set = (id: string, s: string) => (this.root.querySelector('#' + id)!.textContent = s);
    set('speed', String(Math.round(Math.abs(v.speed) * 3.6)));
    set('gear', v.speed < -0.5 ? 'R' : v.speed > 1 ? 'D' : 'N');
    set('health-value', Math.round(v.health) + '%');
    set('boost-value', Math.round(v.boost) + '%');
    (this.root.querySelector('#health-bar') as HTMLElement).style.width = v.health + '%';
    (this.root.querySelector('#boost-bar') as HTMLElement).style.width = v.boost + '%';
    set(
      'temperature',
      v.anchor
        ? 'WINCH ATTACHED · PULLING'
        : v.heat > 80
          ? 'ENGINE HOT · EASE OFF'
          : `${v.terrain.toUpperCase()}  ·  ENGINE ${Math.round(v.heat)}°`,
    );
    set('progress', `CAMP 0${e.camp} / 05`);
    set('parts', `${e.parts} PARTS  ·  ${e.collected.size}/${e.items.length} SALVAGED`);
    set('camera-name', camera.toUpperCase() + ' CAMERA');
    const next = campZ[e.camp + 1];
    set(
      'objective',
      e.won
        ? 'Summit secured. Explore the ridge.'
        : `Reach ${e.camp === 4 ? 'the summit' : 'Camp 0' + (e.camp + 1)}`,
    );
    set(
      'stage',
      `${stages[Math.min(10, Math.max(0, Math.floor(v.position.z / 62)))]}  /  ${next ? Math.round(Math.hypot(next - v.position.z, roadX(next) - v.position.x)) + ' m to camp' : 'Expedition complete'}`,
    );
    set('toast', e.notificationTime > 0 ? e.notification : '');
    const c = this.map;
    c.clearRect(0, 0, 160, 210);
    c.strokeStyle = '#78978c';
    c.lineWidth = 2;
    c.beginPath();
    for (let z = 0; z <= SUMMIT; z += 3) {
      const x = 80 + roadX(z) * 0.65,
        y = 196 - (z / SUMMIT) * 178;
      if (z === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    campZ.forEach((z, i) => {
      c.fillStyle = i <= e.camp ? '#e9b86a' : '#8bac9d';
      c.fillRect(77 + roadX(z) * 0.65, 193 - (z / SUMMIT) * 178, 6, 6);
    });
    c.fillStyle = '#fff7df';
    c.beginPath();
    c.arc(80 + v.position.x * 0.65, 196 - (v.position.z / SUMMIT) * 178, 4, 0, Math.PI * 2);
    c.fill();
  }
}
