// AudioManager.js — tiny WebAudio chimes, synthesized locally, no files.
// Sound is optional: a mute toggle on the table, and nothing plays before
// the first user gesture (browser autoplay policy).

let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function tone(freq, dur, type = 'sine', gain = 0.08, when = 0) {
  if (muted || !ctx) return;
  const t0 = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export function unlockAudio() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function playSound(name) {
  if (muted) return;
  unlockAudio();
  if (!ctx) return;
  if (name === 'play') { tone(523, 0.14); tone(784, 0.18, 'sine', 0.07, 0.07); }
  else if (name === 'draw') { tone(660, 0.08, 'triangle', 0.05); }
  else if (name === 'damage') { tone(196, 0.22, 'sawtooth', 0.06); tone(147, 0.25, 'sawtooth', 0.05, 0.05); }
  else if (name === 'heal') { tone(392, 0.16); tone(523, 0.2, 'sine', 0.07, 0.08); }
  else if (name === 'star') { tone(880, 0.12); tone(1174, 0.2, 'sine', 0.06, 0.06); }
  else if (name === 'win') { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 'sine', 0.08, i * 0.13)); }
  else if (name === 'lose') { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.06, i * 0.14)); }
  else if (name === 'turn') { tone(440, 0.1, 'triangle', 0.05); }
  else if (name === 'illegal') { tone(220, 0.12, 'square', 0.04); }
}
