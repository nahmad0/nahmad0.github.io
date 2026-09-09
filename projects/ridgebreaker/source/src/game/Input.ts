import type { Input } from '../vehicle/Vehicle';
export class Controls {
  keys = new Set<string>();
  pressed = new Set<string>();
  enabled = false;
  constructor() {
    addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code))
        e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.clear());
  }
  clear() {
    this.keys.clear();
    this.pressed.clear();
  }
  consume(code: string) {
    const yes = this.pressed.has(code);
    this.pressed.delete(code);
    return yes;
  }
  read(): Input {
    const k = this.keys,
      down = (a: string, b = '') => k.has(a) || k.has(b);
    const p = navigator.getGamepads?.()[0];
    const dead = (v = 0) => (Math.abs(v) > 0.15 ? v : 0);
    return {
      throttle: this.enabled
        ? Math.max(
            -1,
            Math.min(
              1,
              Number(down('KeyW', 'ArrowUp')) -
                Number(down('KeyS', 'ArrowDown')) +
                (p?.buttons[7]?.value ?? 0) -
                (p?.buttons[6]?.value ?? 0),
            ),
          )
        : 0,
      steer: this.enabled
        ? Math.max(
            -1,
            Math.min(
              1,
              Number(down('KeyD', 'ArrowRight')) -
                Number(down('KeyA', 'ArrowLeft')) +
                dead(p?.axes[0]),
            ),
          )
        : 0,
      brake: this.enabled && (down('Space') || !!p?.buttons[0]?.pressed),
      boost: this.enabled && (down('ShiftLeft', 'ShiftRight') || !!p?.buttons[1]?.pressed),
      winch: this.enabled && (down('KeyE') || !!p?.buttons[2]?.pressed),
    };
  }
}
