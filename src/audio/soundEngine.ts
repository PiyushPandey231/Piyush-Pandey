/**
 * Procedural Web Audio Ambient Soundscape Engine
 * 100% synthesized in-browser with zero external audio assets or dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isRunning: boolean = false;
  private isMasterMuted: boolean = false;
  private currentMasterVolume: number = 0.8;

  // Track channels
  private channelNodes: Map<
    string,
    {
      gain: GainNode;
      panner: StereoPannerNode;
      cleanup: () => void;
    }
  > = new Map();

  // Binaural frequency state
  private binauralBaseFreq: number = 216;
  private binauralBeatDelta: number = 10; // Alpha 10Hz
  private binauralOscLeft: OscillatorNode | null = null;
  private binauralOscRight: OscillatorNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMasterMuted ? 0 : this.currentMasterVolume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public setMasterVolume(vol: number) {
    this.currentMasterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMasterMuted) {
      this.masterGain.gain.setTargetAtTime(this.currentMasterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setMasterMute(muted: boolean) {
    this.isMasterMuted = muted;
    if (this.masterGain && this.ctx) {
      const target = muted ? 0 : this.currentMasterVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
  }

  public setChannelVolume(id: string, volume: number) {
    this.initContext();
    const node = this.channelNodes.get(id);
    if (node && this.ctx) {
      const target = (volume / 100) * 0.5; // Scale to comfortable range
      node.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
    }
  }

  public setChannelPan(id: string, pan: number) {
    const node = this.channelNodes.get(id);
    if (node && this.ctx && node.panner.pan) {
      node.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.08);
    }
  }

  public setBinauralBeatDelta(delta: number) {
    this.binauralBeatDelta = delta;
    if (this.ctx && this.binauralOscRight) {
      this.binauralOscRight.frequency.setTargetAtTime(
        this.binauralBaseFreq + this.binauralBeatDelta,
        this.ctx.currentTime,
        0.1
      );
    }
  }

  public setBinauralBaseFreq(freq: number) {
    this.binauralBaseFreq = freq;
    if (this.ctx && this.binauralOscLeft && this.binauralOscRight) {
      this.binauralOscLeft.frequency.setTargetAtTime(this.binauralBaseFreq, this.ctx.currentTime, 0.1);
      this.binauralOscRight.frequency.setTargetAtTime(this.binauralBaseFreq + this.binauralBeatDelta, this.ctx.currentTime, 0.1);
    }
  }

  public startAllChannels(channelConfigs: Array<{ id: string; volume: number; pan: number; muted: boolean }>) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Clean any existing
    this.stopAllChannels();

    channelConfigs.forEach((cfg) => {
      this.createChannel(cfg.id, cfg.muted ? 0 : cfg.volume, cfg.pan);
    });

    this.isRunning = true;
  }

  public stopAllChannels() {
    this.channelNodes.forEach((node) => {
      node.cleanup();
    });
    this.channelNodes.clear();
    this.isRunning = false;
  }

  private createChannel(id: string, initialVolume: number, initialPan: number) {
    if (!this.ctx || !this.masterGain) return;

    const channelGain = this.ctx.createGain();
    channelGain.gain.setValueAtTime((initialVolume / 100) * 0.5, this.ctx.currentTime);

    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : (this.ctx.createGain() as unknown as StereoPannerNode);
    if (panner.pan) {
      panner.pan.setValueAtTime(initialPan, this.ctx.currentTime);
    }

    channelGain.connect(panner);
    panner.connect(this.masterGain);

    let cleanup = () => {};

    switch (id) {
      case 'rain':
        cleanup = this.initRainGenerator(channelGain);
        break;
      case 'waves':
        cleanup = this.initWavesGenerator(channelGain);
        break;
      case 'campfire':
        cleanup = this.initCampfireGenerator(channelGain);
        break;
      case 'wind':
        cleanup = this.initWindGenerator(channelGain);
        break;
      case 'binaural':
        cleanup = this.initBinauralGenerator(channelGain);
        break;
      case 'pad':
        cleanup = this.initPadGenerator(channelGain);
        break;
      case 'cafe':
        cleanup = this.initCafeGenerator(channelGain);
        break;
      case 'clock':
        cleanup = this.initClockGenerator(channelGain);
        break;
    }

    this.channelNodes.set(id, { gain: channelGain, panner, cleanup });
  }

  // --- Procedural Generators ---

  // 1. Rain generator (Pink/Brown noise + random droplet impulses)
  private initRainGenerator(dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate soft raindrops
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(250, this.ctx.currentTime);

    whiteNoise.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(dest);
    whiteNoise.start();

    // Occasional subtle droplet tap
    let timerId: number | null = null;
    const scheduleDrop = () => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      const freq = 1200 + Math.random() * 900;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.04);

      dropGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      osc.connect(dropGain);
      dropGain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);

      const nextTime = 400 + Math.random() * 1200;
      timerId = window.setTimeout(scheduleDrop, nextTime);
    };
    scheduleDrop();

    return () => {
      try {
        whiteNoise.stop();
        whiteNoise.disconnect();
        if (timerId) clearTimeout(timerId);
      } catch {
        // Safe cleanup
      }
    };
  }

  // 2. Ocean Waves generator (LFO-modulated resonant pink noise)
  private initWavesGenerator(dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // LFO for slow tidal surge (0.12 Hz ~ 8 seconds per wave)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(260, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Dynamic wave volume surge
    const surgeGain = this.ctx.createGain();
    const lfoSurge = this.ctx.createOscillator();
    lfoSurge.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const lfoSurgeAmp = this.ctx.createGain();
    lfoSurgeAmp.gain.setValueAtTime(0.4, this.ctx.currentTime);
    lfoSurge.connect(lfoSurgeAmp);
    lfoSurgeAmp.connect(surgeGain.gain);

    noise.connect(filter);
    filter.connect(surgeGain);
    surgeGain.connect(dest);

    noise.start();
    lfo.start();
    lfoSurge.start();

    return () => {
      try {
        noise.stop();
        lfo.stop();
        lfoSurge.stop();
        noise.disconnect();
      } catch {
        // Safe cleanup
      }
    };
  }

  // 3. Campfire generator (Low rumble + stochastic popping sparks)
  private initCampfireGenerator(dest: AudioNode): () => void {
    if (!this.ctx) return () => {};

    // Low rumble noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(dest);
    noise.start();

    // Wood crackle generator
    let crackleTimer: number | null = null;
    const triggerCrackle = () => {
      if (!this.ctx) return;
      // Burst of high-frequency noise clicks
      const clickLen = 0.005 + Math.random() * 0.015;
      const clickBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * clickLen), this.ctx.sampleRate);
      const clickData = clickBuf.getChannelData(0);
      for (let i = 0; i < clickData.length; i++) {
        clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickData.length * 0.3));
      }
      const clickSource = this.ctx.createBufferSource();
      clickSource.buffer = clickBuf;

      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'highpass';
      clickFilter.frequency.setValueAtTime(1800 + Math.random() * 1200, this.ctx.currentTime);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.18 + Math.random() * 0.25, this.ctx.currentTime);

      clickSource.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(dest);

      clickSource.start();

      const nextDelay = 80 + Math.random() * 260;
      crackleTimer = window.setTimeout(triggerCrackle, nextDelay);
    };
    triggerCrackle();

    return () => {
      try {
        noise.stop();
        noise.disconnect();
        if (crackleTimer) clearTimeout(crackleTimer);
      } catch {
        // Safe cleanup
      }
    };
  }

  // 4. Forest Wind generator (Dual sweeping bandpass filters)
  private initWindGenerator(dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const bp1 = this.ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.setValueAtTime(320, this.ctx.currentTime);
    bp1.Q.setValueAtTime(3.5, this.ctx.currentTime);

    const bp2 = this.ctx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.frequency.setValueAtTime(680, this.ctx.currentTime);
    bp2.Q.setValueAtTime(2.0, this.ctx.currentTime);

    // Slow sweep LFO
    const sweepLFO = this.ctx.createOscillator();
    sweepLFO.frequency.setValueAtTime(0.08, this.ctx.currentTime);

    const sweepGain = this.ctx.createGain();
    sweepGain.gain.setValueAtTime(180, this.ctx.currentTime);

    sweepLFO.connect(sweepGain);
    sweepGain.connect(bp1.frequency);
    sweepGain.connect(bp2.frequency);

    noise.connect(bp1);
    noise.connect(bp2);
    bp1.connect(dest);
    bp2.connect(dest);

    noise.start();
    sweepLFO.start();

    return () => {
      try {
        noise.stop();
        sweepLFO.stop();
        noise.disconnect();
      } catch {
        // Safe cleanup
      }
    };
  }

  // 5. True Binaural Beat Generator (Isolated left and right channels)
  private initBinauralGenerator(dest: AudioNode): () => void {
    if (!this.ctx) return () => {};

    const leftOsc = this.ctx.createOscillator();
    const rightOsc = this.ctx.createOscillator();

    leftOsc.type = 'sine';
    rightOsc.type = 'sine';

    leftOsc.frequency.setValueAtTime(this.binauralBaseFreq, this.ctx.currentTime);
    rightOsc.frequency.setValueAtTime(this.binauralBaseFreq + this.binauralBeatDelta, this.ctx.currentTime);

    this.binauralOscLeft = leftOsc;
    this.binauralOscRight = rightOsc;

    // Route left to left ear, right to right ear using StereoPannerNode or ChannelMerger
    const leftPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const rightPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    if (leftPanner && rightPanner) {
      leftPanner.pan.setValueAtTime(-1.0, this.ctx.currentTime);
      rightPanner.pan.setValueAtTime(1.0, this.ctx.currentTime);

      leftOsc.connect(leftPanner);
      rightOsc.connect(rightPanner);
      leftPanner.connect(dest);
      rightPanner.connect(dest);
    } else {
      leftOsc.connect(dest);
      rightOsc.connect(dest);
    }

    leftOsc.start();
    rightOsc.start();

    return () => {
      try {
        leftOsc.stop();
        rightOsc.stop();
        this.binauralOscLeft = null;
        this.binauralOscRight = null;
      } catch {
        // Safe cleanup
      }
    };
  }

  // 6. Warm Analog Pad (Harmonic drone chord with organic LFO vibrato)
  private initPadGenerator(dest: AudioNode): () => void {
    if (!this.ctx) return () => {};

    // Chord: Root (130.81 Hz - C3), Fifth (196.00 Hz - G3), Octave (261.63 Hz - C4)
    const freqs = [130.81, 196.0, 261.63];
    const oscs: OscillatorNode[] = [];
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    // Warm vibrato LFO
    const vibrato = this.ctx.createOscillator();
    vibrato.frequency.setValueAtTime(0.25, this.ctx.currentTime); // slow organic wave
    const vibratoGain = this.ctx.createGain();
    vibratoGain.gain.setValueAtTime(1.2, this.ctx.currentTime);
    vibrato.connect(vibratoGain);

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq + (idx === 0 ? -0.4 : 0.4), this.ctx.currentTime); // slight detune
      vibratoGain.connect(osc.frequency);
      osc.connect(filter);
      osc.start();
      oscs.push(osc);
    });

    filter.connect(dest);
    vibrato.start();

    return () => {
      try {
        oscs.forEach((o) => o.stop());
        vibrato.stop();
      } catch {
        // Safe cleanup
      }
    };
  }

  // 7. Cafe Murmur (Multi-resonant diffuse ambient warmth)
  private initCafeGenerator(dest: AudioNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // Resonant filters mimicking acoustic human frequency bands
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(500, this.ctx.currentTime);
    f1.Q.setValueAtTime(4.0, this.ctx.currentTime);

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1200, this.ctx.currentTime);
    f2.Q.setValueAtTime(5.0, this.ctx.currentTime);

    // Subtle gentle modulation
    const mod = this.ctx.createOscillator();
    mod.frequency.setValueAtTime(0.4, this.ctx.currentTime);
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(80, this.ctx.currentTime);
    mod.connect(modGain);
    modGain.connect(f1.frequency);

    noise.connect(f1);
    noise.connect(f2);
    f1.connect(dest);
    f2.connect(dest);

    noise.start();
    mod.start();

    return () => {
      try {
        noise.stop();
        mod.stop();
        noise.disconnect();
      } catch {
        // Safe cleanup
      }
    };
  }

  // 8. Mechanical Clock / Rhythmic Metronome (Subtle rhythmic wood ticks)
  private initClockGenerator(dest: AudioNode): () => void {
    if (!this.ctx) return () => {};

    let tickTimer: number | null = null;
    let isHighTick = false;

    const scheduleTick = () => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const freq = isHighTick ? 950 : 780;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.02);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);

      isHighTick = !isHighTick;
      tickTimer = window.setTimeout(scheduleTick, 1000); // 1 tick per second (60 bpm)
    };

    scheduleTick();

    return () => {
      if (tickTimer) clearTimeout(tickTimer);
    };
  }

  // Chime bell on timer completion (528 Hz harmonic chime)
  public playChime() {
    this.initContext();
    if (!this.ctx) return;

    const baseFreq = 528; // Miracle/Love harmonic
    const harmonics = [1, 2.01, 3.02, 4.05];
    const gains = [0.3, 0.15, 0.08, 0.03];

    harmonics.forEach((h, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * h, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gains[i], now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 3.5);
    });
  }
}

export const soundEngine = new SoundEngine();
