import React from 'react';

interface PracticeLogProps {
  todaySeconds: number;
  totalSeconds: number;
}

export const PracticeLog: React.FC<PracticeLogProps> = ({ todaySeconds, totalSeconds }) => {
  
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 flex flex-col items-center">
        <span className="text-zinc-500 text-xs font-serif uppercase tracking-wider mb-1">Today</span>
        <span className="text-2xl text-white font-sans font-light">{formatTime(todaySeconds)}</span>
      </div>
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 flex flex-col items-center">
        <span className="text-zinc-500 text-xs font-serif uppercase tracking-wider mb-1">Total</span>
        <span className="text-2xl text-brass-400 font-sans font-light">{formatTime(totalSeconds)}</span>
      </div>
    </div>
  );
};
