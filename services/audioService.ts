export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private current16thNote: number = 0;
  private nextNoteTime: number = 0.0;
  private timerID: number | undefined;
  private lookahead: number = 25.0; // How frequently to call scheduling function (in milliseconds)
  private scheduleAheadTime: number = 0.1; // How far ahead to schedule audio (in seconds)
  private bpm: number = 100;
  
  // Callback for visual updates (beat number 0-3)
  private onBeatCallback: ((beat: number) => void) | null = null;

  constructor(onBeat?: (beat: number) => void) {
    if (onBeat) this.onBeatCallback = onBeat;
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
  }

  public start() {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.current16thNote = 0;
    // Set first note time to a slight delay to ensure clean start
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
    // We only care about quarter notes for this app (4/4 time usually), 
    // but calculation logic kept general for future subdivision.
    this.nextNoteTime += secondsPerBeat; 

    this.current16thNote++;
    if (this.current16thNote === 4) {
      this.current16thNote = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.audioContext) return;

    // Create oscillator
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    if (beatNumber === 0) {
      // Accent (Beat 1) - Higher Pitch
      osc.frequency.value = 1200;
    } else {
      // Regular Beat - Lower Pitch
      osc.frequency.value = 800;
    }

    // Short click sound
    osc.start(time);
    osc.stop(time + 0.05);
    
    // Envelope for clean sound
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(1, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    // Schedule visual callback
    // We use a simple timeout here to sync UI with Audio time roughly
    // Or we rely on React to just receive the call. 
    // Since AudioTime is different from Date.now, we approximate the delay.
    const timeDiff = time - this.audioContext.currentTime;
    setTimeout(() => {
        if (this.onBeatCallback && this.isPlaying) {
            this.onBeatCallback(beatNumber);
        }
    }, timeDiff * 1000);
  }

  private scheduler() {
    // While there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (this.nextNoteTime < (this.audioContext!.currentTime + this.scheduleAheadTime)) {
        this.scheduleNote(this.current16thNote, this.nextNoteTime);
        this.nextNote();
    }

    if (this.isPlaying) {
        this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }
  }
}
