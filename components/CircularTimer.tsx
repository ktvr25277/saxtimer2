import React from 'react';
import { TimerStatus } from '../types';
import { STATUS_LABELS } from '../constants';

interface CircularTimerProps {
  radius?: number;
  stroke?: number;
  progress: number; // 0 to 100
  timeLeft: number; // in seconds
  overtimeSeconds: number; // in seconds
  status: TimerStatus;
  mainAction: () => void;
  isPaused: boolean;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  radius = 120,
  stroke = 8,
  progress,
  timeLeft,
  overtimeSeconds,
  status,
  mainAction,
  isPaused
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // If overtime, we might want to fill the ring fully or pulse it.
  // For countdown, it decreases. For overtime, let's keep it full but pulse.
  const isOvertime = status === TimerStatus.PRACTICE_OVERTIME || status === TimerStatus.BREAK_OVERTIME;
  const strokeDashoffset = isOvertime ? 0 : circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (isPaused) return 'text-zinc-500';
    switch (status) {
      case TimerStatus.PRACTICE: return 'text-brass-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]';
      case TimerStatus.PRACTICE_OVERTIME: return 'text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse';
      case TimerStatus.BREAK: return 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]';
      case TimerStatus.BREAK_OVERTIME: return 'text-teal-300 drop-shadow-[0_0_15px_rgba(94,234,212,0.6)] animate-pulse';
      default: return 'text-zinc-500';
    }
  };

  const getStrokeColor = () => {
    if (isPaused) return '#52525b';
    switch (status) {
      case TimerStatus.PRACTICE: return '#eab308'; // brass-500
      case TimerStatus.PRACTICE_OVERTIME: return '#f97316'; // orange-500
      case TimerStatus.BREAK: return '#34d399'; // emerald-400
      case TimerStatus.BREAK_OVERTIME: return '#5eead4'; // teal-300
      default: return '#52525b'; // zinc-600
    }
  };

  const getMainLabel = () => {
    if (isPaused) return "PAUSED";
    if (status === TimerStatus.IDLE) return "START PRACTICE";
    if (status === TimerStatus.PRACTICE) return "PRACTICING";
    if (status === TimerStatus.PRACTICE_OVERTIME) return "TIME UP";
    if (status === TimerStatus.BREAK) return "BREAK TIME";
    if (status === TimerStatus.BREAK_OVERTIME) return "BREAK OVER";
    return "";
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className="relative cursor-pointer transition-transform duration-200 active:scale-95" onClick={mainAction}>
        <svg
          height={radius * 2}
          width={radius * 2}
          className={`rotate-[-90deg] transition-all duration-500 ${isPaused ? 'opacity-50' : 'opacity-100'}`}
        >
          {/* Background Ring */}
          <circle
            stroke="#27272a"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress Ring */}
          <circle
            stroke={getStrokeColor()}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-500 ease-in-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-xs tracking-[0.2em] font-bold mb-2 uppercase ${getStatusColor()}`}>
            {getMainLabel()}
          </span>
          
          <span className={`text-6xl font-sans font-light tracking-tighter ${isPaused ? 'text-zinc-500' : 'text-white'}`}>
            {isOvertime ? `+${formatTime(overtimeSeconds)}` : formatTime(timeLeft)}
          </span>
          
          <span className="text-xs text-zinc-500 mt-2 font-serif italic">
            {isOvertime 
               ? (status === TimerStatus.PRACTICE_OVERTIME ? 'Tap to Rest' : 'Tap to Resume') 
               : (status === TimerStatus.IDLE ? 'Tap to Start' : 'Tap to Skip')
            }
          </span>
        </div>
      </div>
    </div>
  );
};