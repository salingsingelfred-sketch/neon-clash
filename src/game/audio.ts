type Wave = OscillatorType;

class AudioSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicStarted = false;
  private muted = false;
  private beat = 0;
  private fightBeat = 0;
  private lastCursorAt = 0;

  private characterPitch(style: string) {
    const pitches: Record<string, number> = {
      blitz: 1,
      nova: 1.12,
      vex: 0.84,
      titan: 0.68,
      echo: 1.24,
      frost: 0.94,
      ember: 1.08,
      cipher: 1.32,
      jade: 0.76,
      onyx: 0.6,
    };
    return pitches[style] ?? 1;
  }

  resume() {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return;
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.72;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') void this.context.resume();
    if (!this.musicStarted) {
      this.musicStarted = true;
      this.playMusicBeat();
      this.playFightMusicBeat();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.72, this.context.currentTime, 0.04);
    }
  }

  private tone(frequency: number, duration: number, wave: Wave = 'sine', volume = 0.16, delay = 0) {
    if (!this.context || !this.master || this.muted) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private noise(duration: number, volume: number, cutoff: number) {
    if (!this.context || !this.master || this.muted) return;
    const sampleRate = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, Math.ceil(sampleRate * duration), sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      const fade = 1 - i / samples.length;
      samples[i] = (Math.random() * 2 - 1) * fade * fade;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff * 2.5, this.context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(cutoff, this.context.currentTime + duration);
    envelope.gain.setValueAtTime(volume, this.context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.master);
    source.start();
    source.stop(this.context.currentTime + duration);
  }

  private playMusicBeat() {
    if (!this.musicStarted) return;
    const melody = [110, 164.81, 196, 146.83, 130.81, 196, 220, 164.81];
    const note = melody[this.beat % melody.length];
    this.tone(note, 0.52, 'triangle', 0.026);
    if (this.beat % 4 === 0) this.tone(note / 2, 0.45, 'sine', 0.075);
    if (this.beat % 2 === 1) this.tone(note * 2, 0.16, 'sine', 0.012, 0.16);
    this.beat += 1;
    window.setTimeout(() => this.playMusicBeat(), 520);
  }

  private playFightMusicBeat() {
    if (!this.musicStarted) return;
    const melody = [110, 130.81, 164.81, 196, 164.81, 146.83, 130.81, 98];
    const step = this.fightBeat % 8;
    const note = melody[step];

    if (step === 0 || step === 4) {
      this.noise(0.13, 0.16, 240);
      this.tone(58, 0.2, 'sine', 0.15);
    } else if (step === 2 || step === 6) {
      this.noise(0.1, 0.085, 1900);
      this.tone(185, 0.1, 'triangle', 0.035);
    }

    this.noise(0.04, 0.035, 5000);
    if (step === 0 || step === 3 || step === 5 || step === 7) {
      this.tone(note * 2, 0.15, 'sawtooth', 0.018);
    }
    this.tone(note / 2, 0.17, 'triangle', 0.028);

    this.fightBeat += 1;
    window.setTimeout(() => this.playFightMusicBeat(), 260);
  }

  ui() {
    if (performance.now() - this.lastCursorAt < 90) return;
    this.tone(660, 0.07, 'sine', 0.1);
  }

  cursor() {
    this.lastCursorAt = performance.now();
    this.tone(1046.5, 0.045, 'square', 0.045);
    this.tone(1568, 0.035, 'sine', 0.025, 0.012);
  }

  hit() {
    this.tone(110, 0.12, 'sawtooth', 0.16);
    this.tone(190, 0.08, 'triangle', 0.1, 0.015);
  }

  swing() {
    this.noise(0.11, 0.09, 780);
    this.tone(280, 0.09, 'triangle', 0.045);
  }

  impact(special: boolean) {
    this.noise(special ? 0.24 : 0.16, special ? 0.3 : 0.2, special ? 540 : 820);
    this.tone(special ? 58 : 78, special ? 0.34 : 0.22, 'sine', special ? 0.48 : 0.34);
    this.tone(special ? 190 : 145, 0.12, 'square', special ? 0.17 : 0.11);
    if (special) {
      this.tone(980, 0.17, 'sawtooth', 0.1);
      this.tone(1460, 0.11, 'triangle', 0.075, 0.025);
    }
  }

  clash() {
    this.noise(0.13, 0.14, 1800);
    this.tone(740, 0.12, 'triangle', 0.15);
    this.tone(1120, 0.17, 'sine', 0.1, 0.035);
  }

  special() {
    this.noise(0.34, 0.18, 1100);
    this.tone(92, 0.52, 'sawtooth', 0.23);
    this.tone(220, 0.42, 'sawtooth', 0.19);
    this.tone(440, 0.3, 'triangle', 0.14, 0.045);
    this.tone(880, 0.24, 'sine', 0.09, 0.09);
    this.tone(1320, 0.18, 'triangle', 0.065, 0.15);
  }

  fighterSwing(style: string) {
    const pitch = this.characterPitch(style);
    this.tone(280 * pitch, 0.075, 'triangle', 0.025);
  }

  fighterImpact(style: string, special: boolean) {
    const pitch = this.characterPitch(style);
    this.tone((special ? 320 : 220) * pitch, special ? 0.16 : 0.1, 'triangle', 0.055);
  }

  fighterClash(style: string) {
    const pitch = this.characterPitch(style);
    this.tone(740 * pitch, 0.1, 'sine', 0.05);
  }

  fighterSpecial(style: string) {
    const pitch = this.characterPitch(style);
    this.tone(440 * pitch, 0.26, 'triangle', 0.065, 0.045);
  }

  jump() {
    this.tone(330, 0.12, 'triangle', 0.07);
  }

  dash() {
    this.tone(520, 0.1, 'sawtooth', 0.055);
  }

  win() {
    this.tone(523.25, 0.22, 'triangle', 0.12);
    this.tone(659.25, 0.24, 'triangle', 0.12, 0.12);
    this.tone(783.99, 0.38, 'triangle', 0.14, 0.25);
  }
}

export const sfx = new AudioSystem();
