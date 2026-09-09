import { Vehicle } from '../vehicle/Vehicle';
export class AudioManager {
  context?: AudioContext;
  osc?: OscillatorNode;
  gain?: GainNode;
  noiseGain?: GainNode;
  filter?: BiquadFilterNode;
  master?: GainNode;
  volume = 0.25;
  start() {
    if (this.context) {
      void this.context.resume();
      return;
    }
    const c = (this.context = new AudioContext());
    this.master = c.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(c.destination);
    const o = (this.osc = c.createOscillator());
    o.type = 'sawtooth';
    this.gain = c.createGain();
    this.gain.gain.value = 0.02;
    const low = c.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 500;
    o.connect(low);
    low.connect(this.gain);
    this.gain.connect(this.master);
    o.start();
    const buffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate),
      data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    this.filter = c.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 450;
    this.noiseGain = c.createGain();
    this.noiseGain.gain.value = 0.02;
    source.connect(this.filter);
    this.filter.connect(this.noiseGain);
    this.noiseGain.connect(this.master);
    source.start();
  }
  setVolume(v: number) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }
  update(v: Vehicle, active: boolean, rain: boolean) {
    if (!this.context || !this.osc || !this.gain) return;
    const t = this.context.currentTime;
    this.osc.frequency.setTargetAtTime(35 + Math.abs(v.speed) * 3 + (v.boosting ? 35 : 0), t, 0.08);
    this.gain.gain.setTargetAtTime(active ? 0.03 + (v.boosting ? 0.035 : 0) : 0, t, 0.1);
    this.noiseGain!.gain.setTargetAtTime(
      active
        ? 0.01 + Math.abs(v.speed) * 0.001 + (rain ? 0.025 : 0) + (v.terrain === 'water' ? 0.04 : 0)
        : 0,
      t,
      0.1,
    );
    this.filter!.frequency.setTargetAtTime(
      v.terrain === 'water' ? 1800 : v.terrain === 'mud' ? 180 : 500,
      t,
      0.1,
    );
  }
  chime() {
    if (!this.context || !this.master) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain();
    o.frequency.setValueAtTime(440, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.18);
    g.gain.setValueAtTime(0.15, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
    o.connect(g);
    g.connect(this.master);
    o.start();
    o.stop(c.currentTime + 0.6);
  }
  impact(strength: number) {
    if (!this.context || !this.master) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(95, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(25, c.currentTime + 0.18);
    g.gain.setValueAtTime(Math.min(0.5, strength * 0.025), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.connect(g);
    g.connect(this.master);
    o.start();
    o.stop(c.currentTime + 0.24);
  }
}
