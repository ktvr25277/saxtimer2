import React from 'react';
import { TimerStatus } from '../types';
import { STATUS_LABELS } from '../constants';

interface CircularTimerProps {
  radius?: number;
  stroke?: number;
  progress: number; // 0 to 100
  timeLeft: number; // in seconds
  status: TimerStatus;
  toggleTimer: () => void;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  radius = 120,
  stroke = 8,
  progress,
  timeLeft,
  status,
  toggleTimer
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (status) {
      case TimerStatus.PRACTICE: return 'text-brass-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]';
      case TimerStatus.BREAK: return 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]';
      default: return 'text-zinc-500';
    }
  };

  const getStrokeColor = () => {
    switch (status) {
      case TimerStatus.PRACTICE: return '#eab308'; // brass-500
      case TimerStatus.BREAK: return '#34d399'; // emerald-400
      default: return '#52525b'; // zinc-600
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative cursor-pointer active:scale-95 transition-transform duration-200" onClick={toggleTimer}>
        <svg
          height={radius * 2}
          width={radius * 2}
          className="rotate-[-90deg] transition-all duration-500"
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
          <span className={`text-sm tracking-[0.2em] font-bold mb-2 ${getStatusColor()}`}>
            {STATUS_LABELS[status]}
          </span>
          <span className="text-6xl font-sans font-light text-white tracking-tighter">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-zinc-500 mt-2 font-serif italic">
            {status === TimerStatus.IDLE ? 'Tap to Start' : status === TimerStatus.PRACTICE ? 'Focus' : 'Relax'}
          </span>
        </div>
      </div>
    </div>
  );
};
