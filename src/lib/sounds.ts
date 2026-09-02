/**
 * BK MARKET — minimal Web Audio engine.
 * Only meaningful moments make sound. Everything is synthesized at
 * runtime: no asset downloads, no speech, no background music.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

const STORAGE_KEY = "bk_sound_enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === null ? true : v === "1";
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !enabled) return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type ToneOpts = {
  freq: number;
  dur?: number;
  type?: OscillatorType;
  delay?: number;
  vol?: number;
  sweepTo?: number;
};

function tone({
  freq,
  dur = 0.16,
  type = "sine",
  delay = 0,
  vol = 0.5,
  sweepTo,
}: ToneOpts) {
  const c = audio();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function shimmer(dur: number, vol: number, from: number, to: number, delay = 0) {
  const c = audio();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const frames = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t0);
}

export const sfx = {
  /** very light tick — played once when the visitor first interacts */
  tick() {
    tone({ freq: 880, dur: 0.07, type: "sine", vol: 0.16 });
    tone({ freq: 1320, dur: 0.05, type: "sine", vol: 0.07, delay: 0.02 });
  },

  /** opening the purchase window */
  open() {
    tone({ freq: 430, sweepTo: 700, dur: 0.24, type: "sine", vol: 0.24 });
  },

  /** confirming the order */
  purchase() {
    tone({ freq: 660, dur: 0.1, type: "triangle", vol: 0.28 });
    tone({ freq: 990, dur: 0.12, type: "sine", vol: 0.16, delay: 0.07 });
  },

  /** purchase completed */
  success() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ freq: f, dur: 0.45, type: "sine", vol: 0.3, delay: i * 0.085 })
    );
    tone({ freq: 1567.98, dur: 0.8, type: "sine", vol: 0.12, delay: 0.36 });
    shimmer(0.6, 0.045, 2400, 7000, 0.1);
  },

  /** something went wrong */
  error() {
    tone({ freq: 220, dur: 0.18, type: "sawtooth", vol: 0.22 });
    tone({ freq: 160, dur: 0.3, type: "sawtooth", vol: 0.2, delay: 0.16 });
  },

  /** cancel confirmation */
  cancel() {
    tone({ freq: 340, sweepTo: 150, dur: 0.28, type: "triangle", vol: 0.2 });
  },
};
