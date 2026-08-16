// Web Audio API Electrical Sound Synthesizer (No external audio files required)

class ElectricalAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private humOscillator: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopHum();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // 1. Violent Arc Flash / Short Circuit Explosion Sound
  public playArcFlashSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // --- Noise Burst (White noise through bandpass filter for sizzle / electrical arc) ---
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(2.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(1.0, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      whiteNoise.start(now);

      // --- Low-frequency electrical blast boom ---
      const boomOsc = this.ctx.createOscillator();
      boomOsc.type = 'triangle';
      boomOsc.frequency.setValueAtTime(110, now);
      boomOsc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

      const boomGain = this.ctx.createGain();
      boomGain.gain.setValueAtTime(0.9, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      boomOsc.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boomOsc.start(now);
      boomOsc.stop(now + 0.35);

      // --- Mechanical breaker snap 80ms later ---
      setTimeout(() => {
        this.playBreakerTripSound();
      }, 70);

    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // 2. Mechanical Breaker Trip Sound ("CLACK!")
  public playBreakerTripSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Fast snap transient
      const clickOsc = this.ctx.createOscillator();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(800, now);
      clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.7, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.06);

      // Metal resonance
      const metalOsc = this.ctx.createOscillator();
      metalOsc.type = 'sawtooth';
      metalOsc.frequency.setValueAtTime(320, now + 0.01);
      metalOsc.frequency.exponentialRampToValueAtTime(90, now + 0.09);

      const metalGain = this.ctx.createGain();
      metalGain.gain.setValueAtTime(0.4, now + 0.01);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      metalOsc.connect(metalGain);
      metalGain.connect(this.ctx.destination);
      metalOsc.start(now + 0.01);
      metalOsc.stop(now + 0.09);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // 3. RCD Earth Leakage Trip Solenoid ("SNAP-TICK")
  public playRcdTripSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);

      setTimeout(() => {
        this.playBreakerTripSound();
      }, 30);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // 4. Subtle 50Hz AC Power Hum
  public startNormalHum() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      this.stopHum();

      const now = this.ctx.currentTime;
      this.humOscillator = this.ctx.createOscillator();
      this.humOscillator.type = 'sine';
      this.humOscillator.frequency.setValueAtTime(50, now); // Chilean 50Hz frequency standard

      this.humGain = this.ctx.createGain();
      this.humGain.gain.setValueAtTime(0.001, now);
      this.humGain.gain.linearRampToValueAtTime(0.04, now + 0.5);

      this.humOscillator.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);
      this.humOscillator.start(now);
    } catch (e) {
      console.warn('Hum error:', e);
    }
  }

  public stopHum() {
    try {
      if (this.humGain && this.ctx) {
        this.humGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      }
      setTimeout(() => {
        if (this.humOscillator) {
          try {
            this.humOscillator.stop();
            this.humOscillator.disconnect();
          } catch {}
          this.humOscillator = null;
        }
      }, 120);
    } catch {}
  }
}

export const electricalAudio = new ElectricalAudioEngine();
