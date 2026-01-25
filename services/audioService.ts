import { AlarmType } from "../types";

export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private current16thNote: number = 0;
  private nextNoteTime: number = 0.0;
  private timerID: number | undefined;
  private lookahead: number = 25.0; 
  private scheduleAheadTime: number = 0.1; 
  private bpm: number = 60;
  
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

  public start() {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.05;
    
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

    this.current16thNote++;
    if (this.current16thNote === 4) {
      this.current16thNote = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    if (beatNumber === 0) {
      osc.frequency.value = 1200;
    } else {
      osc.frequency.value = 800;
    }

    osc.start(time);
    osc.stop(time + 0.05);
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(1, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    const timeDiff = time - this.audioContext.currentTime;
    setTimeout(() => {
        if (this.onBeatCallback && this.isPlaying) {
            this.onBeatCallback(beatNumber);
        }
    }, timeDiff * 1000);
  }

  private scheduler() {
    while (this.nextNoteTime < (this.audioContext!.currentTime + this.scheduleAheadTime)) {
        this.scheduleNote(this.current16thNote, this.nextNoteTime);
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
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
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