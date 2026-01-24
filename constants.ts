import { TimerStatus } from "./types";

export const PRACTICE_DURATION = 600; // 10 minutes in seconds
export const BREAK_DURATION = 300; // 5 minutes in seconds

export const MIN_BPM = 40;
export const MAX_BPM = 220;

export const THEME = {
  gold: '#eab308',
  goldDim: '#854d0e',
  black: '#050505',
  gray: '#27272a'
};

export const FALLBACK_ADVICE = [
  "ロングトーンは音の出だしと処理を丁寧に。息の圧力を一定に保ちましょう。",
  "高音域は噛みすぎないように。喉を開いて、歌うようにイメージしてください。",
  "指の力が入りすぎていませんか？ リラックスしてキーに触れるだけにしましょう。",
  "アンブシュアが崩れていませんか？ 鏡を見て確認しましょう。",
  "スケール練習は均等なリズムで。メトロノームの裏拍を感じてください。",
  "ソプラノサックスはピッチが命です。チューナーを見すぎず、耳で合わせましょう。",
  "休憩も練習のうちです。水分補給をしてリフレッシュしましょう。",
  "タンギングは舌の先で軽くリードに触れるだけ。鋭く速く。",
  "ヴィブラートは顎ではなく、喉の響きを意識してかけましょう。",
  "今の課題を一つだけ決めて、そこだけに集中して練習してください。"
];

export const STATUS_LABELS: Record<TimerStatus, string> = {
  [TimerStatus.IDLE]: "READY",
  [TimerStatus.PRACTICE]: "PRACTICE",
  [TimerStatus.BREAK]: "BREAK"
};
