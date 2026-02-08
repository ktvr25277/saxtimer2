export enum TimerStatus {
  IDLE = 'IDLE',
  PRACTICE = 'PRACTICE',
  PRACTICE_OVERTIME = 'PRACTICE_OVERTIME',
  BREAK = 'BREAK',
  BREAK_OVERTIME = 'BREAK_OVERTIME',
  PAUSED = 'PAUSED' // Meta state, usually handled alongside a previous state
}

export enum SoundType {
  HIGH = 'HIGH',
  LOW = 'LOW'
}

export enum AlarmType {
  DIGITAL = 'DIGITAL',
  GONG = 'GONG',
  CHORD = 'CHORD'
}

export enum InstrumentKey {
  C = 'C',
  Bb = 'Bb',
  Eb = 'Eb'
}

export interface PracticeStats {
  todaySeconds: number;
  totalSeconds: number;
  lastPracticeDate: string; // YYYY-MM-DD
}

export interface AdviceData {
  text: string;
  source: 'AI' | 'FALLBACK';
}