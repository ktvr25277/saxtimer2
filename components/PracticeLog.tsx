import React from 'react';
import { Trophy, Activity } from 'lucide-react';

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
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* Today Block */}
      <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center justify-between overflow-hidden">
        {/* Top Highlight */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-30" />
        
        <div className="flex items-center gap-2.5">
           <div className="p-1.5 rounded-md bg-zinc-800/50 text-zinc-400 border border-zinc-700/30">
             <Activity size={14} />
           </div>
           <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Today</span>
        </div>
        
        <span className="text-lg font-sans font-medium text-zinc-100 tracking-tight">
          {formatTime(todaySeconds)}
        </span>
      </div>

      {/* Total Block */}
      <div className="relative bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between overflow-hidden group">
        {/* Top Highlight - Gold */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brass-600/50 to-transparent opacity-50" />
        {/* Ambient Glow */}
        <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-brass-500/10 blur-xl rounded-full pointer-events-none" />

        <div className="flex items-center gap-2.5">
           <div className="p-1.5 rounded-md bg-brass-900/20 text-brass-500 border border-brass-500/20">
             <Trophy size={14} />
           </div>
           <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-brass-500/70 transition-colors">Total</span>
        </div>
        
        <span className="text-lg font-sans font-medium text-brass-400 tracking-tight shadow-brass-500/10">
          {formatTime(totalSeconds)}
        </span>
      </div>
    </div>
  );
};