import { AlarmType, MetronomeSoundType } from "../types";

export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentBeatIndex: number = 0; // Renamed from current16thNote for clarity
  private nextNoteTime: number = 0.0;
  private timerID: number | undefined;
  private lookahead: number = 25.0; 
  private scheduleAheadTime: number = 0.1; 
  private bpm: number = 60;
  private beatsPerBar: number = 4; // Default to 4/4
  private soundType: MetronomeSoundType = MetronomeSoundType.DIGITAL;
  private volume: number = 1.0; // Master volume for metronome
  
  private noiseBuffer: AudioBuffer | null = null;
  private onBeatCallback: ((beat: number) => void) | null = null;

  constructor(onBeat?: (beat: number) => void) {
    if (onBeat) this.onBeatCallback = onBeat;
  }

  public setOnBeat(callback: (beat: number) => void) {
    this.onBeatCallback = callback;
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public setBeatsPerBar(beats: number) {
    this.beatsPerBar = beats;
    // Reset counter if it exceeds the new limit to prevent glitches
    if (this.currentBeatIndex >= beats) {
      this.currentBeatIndex = 0;
    }
  }

  public setSoundType(type: MetronomeSoundType) {
    this.soundType = type;
  }

  public setVolume(vol: number) {
    this.volume = vol;
  }

  // New method to explicitly resume context (called when app comes to foreground)
  public async resumeContext() {
    if (this.audioContext && (this.audioContext.state === 'suspended' || (this.audioContext.state as string) === 'interrupted')) {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.error("Failed to resume metronome context:", e);
      }
    }
  }

  // iOS Fix: Call this on user interaction to unlock/reset AudioContext
  public prepare() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Re-attach state listener
      this.audioContext.onstatechange = () => {
        if ((this.audioContext?.state as string) === 'interrupted' && this.isPlaying) {
             this.audioContext.resume();
        }
      };
    }
    
    // Init Noise Buffer for Mechanical Click
    if (!this.noiseBuffer && this.audioContext) {
      try {
        const bufferSize = this.audioContext.sampleRate * 0.1; // 100ms
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        // Create an impulse with exponential decay
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4);
        }
        this.noiseBuffer = buffer;
      } catch (e) {
        console.error("Failed to create noise buffer:", e);
      }
    }
    
    if (this.audioContext.state === 'suspended' || (this.audioContext.state as string) === 'interrupted') {
      this.audioContext.resume();
    }

    // Play silent buffer to unlock
    try {
      const buffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (e) {
      console.error("Failed to play silent buffer in metronome:", e);
    }
  }

  // Force Re-creation of AudioContext
  // This is crucial for iOS when the context gets stuck in 'interrupted' state
  public hardReset() {
    this.stop();
    const oldContext = this.audioContext;
    
    // Nullify first so prepare() creates a NEW context synchronously
    this.audioContext = null;
    this.noiseBuffer = null;
    
    // Immediately create new context (Must happen in the user click event stack)
    this.prepare();
    
    // Clean up old context asynchronously
    if (oldContext) {
      oldContext.close().catch(e => console.error("Error closing old metronome context:", e));
    }
  }

  public start() {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      this.prepare(); // Use prepare to init if not exists
    } else if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentBeatIndex = 0;
    this.nextNoteTime = this.audioContext!.currentTime + 0.05;
    
    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    window.clearTimeout(this.timerID);
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat; 

    this.currentBeatIndex++;
    if (this.currentBeatIndex >= this.beatsPerBar) {
      this.currentBeatIndex = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.audioContext) return;

    // Trigger sound based on selected type
    switch (this.soundType) {
      case MetronomeSoundType.CLICK:
        this.playMechanical(beatNumber === 0, time);
        break;
      case MetronomeSoundType.WOOD:
        this.playWood(beatNumber === 0, time);
        break;
      case MetronomeSoundType.DIGITAL:
      default:
        this.playDigital(beatNumber === 0, time);
        break;
    }

    const timeDiff = time - this.audioContext.currentTime;
    // Only callback if reasonable timeDiff (prevent callbacks for very old events)
    if (timeDiff >= -0.1) {
        setTimeout(() => {
            if (this.onBeatCallback && this.isPlaying) {
                this.onBeatCallback(beatNumber);
            }
        }, timeDiff * 1000);
    }
  }

  private playDigital(isStrong: boolean, time: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    if (isStrong) {
      osc.frequency.value = 1200; // Downbeat
    } else {
      osc.frequency.value = 800; // Weak beat
    }

    osc.start(time);
    osc.stop(time + 0.05);
    
    const peak = 1.0 * this.volume;
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(peak, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  }

  // Realistic Mechanical Metronome (Click + Bell)
  private playMechanical(isStrong: boolean, time: number) {
    if (!this.audioContext) return;
    
    // 1. The "Click" (Mechanism)
    // Uses the noise buffer to create a sharp "snap"
    if (this.noiseBuffer) {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.noiseBuffer;
      
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 2.0;
      // Slightly different resonance for strong/weak to simulate mechanism cycle
      filter.frequency.value = isStrong ? 2000 : 1600; 

      const gain = this.audioContext.createGain();
      gain.gain.value = 0.5 * this.volume; // Base click volume adjusted

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioContext.destination);

      source.start(time);
    }

    // 2. The "Bell" (Downbeat)
    if (isStrong) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, time); // High pitched bell
      
      // Instant attack, long decay
      const peak = 0.3 * this.volume;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(peak, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

      osc.start(time);
      osc.stop(time + 0.6);
    }
  }

  private playWood(isStrong: boolean, time: number) {
    if (!this.audioContext) return;
    
    // Use Triangle wave for hollower sound, filtered
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    osc.type = 'triangle';
    // Lowpass to remove harsh digital edge of triangle
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    const strongGain = 0.7 * this.volume;
    const weakGain = 0.5 * this.volume;

    if (isStrong) {
      osc.frequency.setValueAtTime(900, time);
      gainNode.gain.setValueAtTime(strongGain, time);
    } else {
      osc.frequency.setValueAtTime(700, time);
      gainNode.gain.setValueAtTime(weakGain, time);
    }

    osc.start(time);
    osc.stop(time + 0.1);
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(isStrong ? strongGain : weakGain, time + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  }

  private scheduler() {
    if (!this.audioContext) return;

    // DRIFT CORRECTION:
    // If the app was backgrounded, nextNoteTime might be way in the past.
    // If we are lagging more than 0.2s, reset the clock to avoid "machine gun" catch-up effect.
    if (this.nextNoteTime < this.audioContext.currentTime - 0.2) {
        this.nextNoteTime = this.audioContext.currentTime + 0.05;
        this.currentBeatIndex = 0; // Optional: Reset to downbeat on resume
    }

    while (this.nextNoteTime < (this.audioContext.currentTime + this.scheduleAheadTime)) {
        this.scheduleNote(this.currentBeatIndex, this.nextNoteTime);
        this.nextNote();
    }

    if (this.isPlaying) {
        this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }
  }
}

// --- Alarm Engine ---

export class AlarmEngine {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private loopId: number | undefined;

  private initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Check state and resume if needed
    if (this.audioContext.state === 'suspended' || (this.audioContext.state as string) === 'interrupted') {
      this.audioContext.resume();
    }
  }

  // iOS Fix: Call this on user interaction (button click) to unlock AudioContext
  public prepare() {
    this.initContext();
    if (this.audioContext) {
      // Create a short silent buffer and play it to unlock the context on iOS
      const buffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    }
  }

  // Force Re-creation for Alarm as well
  public hardReset() {
    this.stop();
    const oldContext = this.audioContext;
    
    this.audioContext = null;
    this.prepare(); // Synchronous creation of new context

    if (oldContext) {
      oldContext.close().catch(e => console.error("Error closing old alarm context:", e));
    }
  }

  // Allow external resume (e.g. on app foreground)
  public async resumeContext() {
    if (this.audioContext && (this.audioContext.state === 'suspended' || (this.audioContext.state as string) === 'interrupted')) {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.error("Failed to resume alarm context:", e);
      }
    }
  }

  public play(type: AlarmType, loop: boolean = false) {
    this.initContext();
    if (!this.audioContext) return;
    this.isPlaying = true;

    const playSound = () => {
      if (!this.isPlaying) return;
      
      const now = this.audioContext!.currentTime;

      switch (type) {
        case AlarmType.DIGITAL:
          this.playDigitalBeep(now);
          if (loop) this.loopId = window.setTimeout(playSound, 1000);
          break;
        case AlarmType.GONG:
          this.playGong(now);
          if (loop) this.loopId = window.setTimeout(playSound, 2500);
          break;
        case AlarmType.CHORD:
          this.playChord(now);
          if (loop) this.loopId = window.setTimeout(playSound, 2000);
          break;
      }
    };

    playSound();
  }

  public stop() {
    this.isPlaying = false;
    clearTimeout(this.loopId);
  }

  private playDigitalBeep(t: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(880, t + 0.1);
    osc.frequency.setValueAtTime(1760, t + 0.1);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    
    osc.start(t);
    osc.stop(t + 0.2);

    // Echo
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(this.audioContext.destination);
    osc2.type = 'square';
    osc2.frequency.value = 1760;
    gain2.gain.setValueAtTime(0.05, t + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc2.start(t + 0.25);
    osc2.stop(t + 0.4);
  }

  private playGong(t: number) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.1);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
    
    osc.start(t);
    osc.stop(t + 2.0);
  }

  private playChord(t: number) {
    if (!this.audioContext) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext!.destination);
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = t + (i * 0.05);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
      
      osc.start(startTime);
      osc.stop(startTime + 1.5);
    });
  }
}

// --- Reverb Engine ---

export type ReverbMode = 'none' | 'room' | 'hall';

export class ReverbEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private dryGainNode: GainNode | null = null;
  private wetGainNode: GainNode | null = null;
  
  private roomBuffer: AudioBuffer | null = null;
  private hallBuffer: AudioBuffer | null = null;

  constructor() {}

  public connect(audioElement: HTMLMediaElement) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Only create source node once per element to avoid error
    // Note: This relies on the audio element being fresh or this engine being persistent for the element
    try {
      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
      }
    } catch (e) {
      // Source might already be connected if we are re-using engine with same element
      console.warn("MediaElementSource already attached", e);
    }

    if (!this.dryGainNode) this.dryGainNode = this.audioContext.createGain();
    if (!this.wetGainNode) this.wetGainNode = this.audioContext.createGain();
    if (!this.convolverNode) this.convolverNode = this.audioContext.createConvolver();

    // Generate IRs if needed
    if (!this.roomBuffer) this.roomBuffer = this.generateImpulse(0.8, 4.0);
    if (!this.hallBuffer) this.hallBuffer = this.generateImpulse(2.5, 2.0);

    // Default wiring (None)
    this.sourceNode?.disconnect();
    this.sourceNode?.connect(this.dryGainNode);
    
    this.dryGainNode?.disconnect();
    this.dryGainNode?.connect(this.audioContext.destination);

    this.convolverNode?.disconnect();
    this.wetGainNode?.disconnect();
  }

  public setMode(mode: ReverbMode) {
    if (!this.audioContext || !this.sourceNode || !this.dryGainNode || !this.wetGainNode || !this.convolverNode) return;

    // Reset Connections
    this.sourceNode.disconnect();
    this.dryGainNode.disconnect();
    this.convolverNode.disconnect();
    this.wetGainNode.disconnect();

    if (mode === 'none') {
      // Direct Path Only
      this.sourceNode.connect(this.dryGainNode);
      this.dryGainNode.connect(this.audioContext.destination);
      this.dryGainNode.gain.value = 1.0;
    } else {
      // Split Path
      // 1. Dry
      this.sourceNode.connect(this.dryGainNode);
      this.dryGainNode.connect(this.audioContext.destination);
      this.dryGainNode.gain.value = 0.8; // Reduce dry slightly

      // 2. Wet
      this.sourceNode.connect(this.convolverNode);
      this.convolverNode.buffer = mode === 'room' ? this.roomBuffer : this.hallBuffer;
      this.convolverNode.connect(this.wetGainNode);
      this.wetGainNode.connect(this.audioContext.destination);
      this.wetGainNode.gain.value = mode === 'room' ? 0.4 : 0.6; // Reverb level
    }
  }

  private generateImpulse(duration: number, decay: number): AudioBuffer {
    if (!this.audioContext) throw new Error("No Context");
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            // White noise with exponential decay
            const noise = (Math.random() * 2 - 1);
            const k = i / length;
            // Add some simple delay reflections for "early reflections" simulation
            // This is a very basic synthetic reverb
            data[i] = noise * Math.pow(1 - k, decay);
        }
    }
    return impulse;
  }
}