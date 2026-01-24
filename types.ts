export enum TimerStatus {
  IDLE = 'IDLE',
  PRACTICE = 'PRACTICE',
  BREAK = 'BREAK'
}

export enum SoundType {
  HIGH = 'HIGH',
  LOW = 'LOW'
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
