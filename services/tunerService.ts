export interface TunerResult {
  noteIndex: number; // 0=C, 1=C#, ..., 11=B. -1 for silence/undefined
  cents: number;
  frequency: number;
  isActive: boolean;
}

export class TunerEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private rafId: number | null = null;
  private buffer: Float32Array = new Float32Array(2048);
  private onUpdate: (result: TunerResult) => void;

  constructor(onUpdate: (result: TunerResult) => void) {
    this.onUpdate = onUpdate;
  }

  public async start() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.source.connect(this.analyser);
      this.updatePitch();
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      throw err;
    }
  }

  public stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    // Note: We generally keep AudioContext alive or suspend it, but for simple cleanup:
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.suspend();
    }
    this.onUpdate({ noteIndex: -1, cents: 0, frequency: 0, isActive: false });
  }

  private updatePitch = () => {
    if (!this.analyser) return;

    this.analyser.getFloatTimeDomainData(this.buffer);
    const frequency = this.autoCorrelate(this.buffer, this.audioContext!.sampleRate);

    if (frequency === -1) {
       // No signal or unclear
       this.onUpdate({ noteIndex: -1, cents: 0, frequency: 0, isActive: true });
    } else {
       const note = this.noteFromPitch(frequency);
       const cents = this.centsOffFromPitch(frequency, note);
       const noteIndex = note % 12;
       this.onUpdate({ noteIndex, cents, frequency, isActive: true });
    }

    this.rafId = requestAnimationFrame(this.updatePitch);
  };

  private noteFromPitch(frequency: number): number {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
  }

  private frequencyFromNoteNumber(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  private centsOffFromPitch(frequency: number, note: number): number {
    return Math.floor(1200 * Math.log(frequency / this.frequencyFromNoteNumber(note)) / Math.log(2));
  }

  // Basic Autocorrelation Algorithm
  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    const SIZE = buf.length;
    let rms = 0;
    
    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.01) return -1; // Signal too low

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    const buf2 = buf.slice(r1, r2);
    const c = new Array(buf2.length).fill(0);
    
    for (let i = 0; i < buf2.length; i++) {
      for (let j = 0; j < buf2.length - i; j++) {
        c[i] = c[i] + buf2[j] * buf2[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    
    for (let i = d; i < buf2.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    // Interpolation for better precision
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }
}