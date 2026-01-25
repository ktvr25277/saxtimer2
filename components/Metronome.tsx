import React, { useEffect, useRef, useState } from 'react';
import { MetronomeEngine } from '../services/audioService';
import { MIN_BPM, MAX_BPM } from '../constants';
import { Play, Square } from 'lucide-react';

interface MetronomeProps {
  className?: string;
  engine: MetronomeEngine | null;
  isPlaying: boolean;
  onToggle: () => void;
}

export const Metronome: React.FC<MetronomeProps> = ({ 
  className,
  engine,
  isPlaying,
  onToggle
}) => {
  const [bpm, setBpm] = useState(60);
  const [activeBeat, setActiveBeat] = useState<number>(-1); // 0-3
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Connect UI beat visualizer to Engine
  useEffect(() => {
    if (engine) {
      engine.setOnBeat((beat) => {
        setActiveBeat(beat);
        // Auto clear active beat for visual blink effect
        setTimeout(() => setActiveBeat(-1), 150);
      });
      // Sync initial BPM
      engine.setBpm(bpm);
    }
  }, [engine]); // Run when engine is available

  // Update Engine BPM when local state changes
  useEffect(() => {
    if (engine) {
      engine.setBpm(bpm);
    }
  }, [bpm, engine]);

  // Generate BPM options for the wheel
  const bpmOptions = Array.from({ length: MAX_BPM - MIN_BPM + 1 }, (_, i) => MIN_BPM + i);

  // Handle Wheel Scroll
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, clientHeight } = scrollContainerRef.current;
      const itemHeight = 32; // Reduced height of each BPM item
      const centerIndex = Math.round(scrollTop / itemHeight);
      const newBpm = MIN_BPM + centerIndex;
      
      if (newBpm >= MIN_BPM && newBpm <= MAX_BPM && newBpm !== bpm) {
         setBpm(newBpm);
      }
    }
  };

  // Center the initial BPM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const itemHeight = 32;
      const targetScroll = (bpm - MIN_BPM) * itemHeight;
      scrollContainerRef.current.scrollTop = targetScroll;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Visual Beats */}
      <div className="flex gap-4 mb-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`
              w-3 h-3 rounded-full transition-all duration-75 border border-zinc-700
              ${activeBeat === i 
                ? (i === 0 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-brass-400 shadow-[0_0_8px_#facc15]') 
                : 'bg-zinc-900'}
            `}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-8 w-full max-w-xs bg-zinc-900/50 rounded-2xl py-3 border border-zinc-800">
        
        {/* Play Button */}
        <button
          onClick={onToggle}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
            ${isPlaying 
              ? 'bg-zinc-800 text-brass-500 border border-brass-500/30' 
              : 'bg-brass-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:bg-brass-400'}
          `}
        >
          {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>

        {/* Separator line for style */}
        <div className="h-10 w-[1px] bg-zinc-800" />

        {/* BPM Display & Wheel */}
        <div className="flex items-center gap-4">
           <div className="text-right">
             <span className="block text-[10px] text-zinc-500 font-serif tracking-widest">BPM</span>
             <span className="block text-2xl font-mono text-white leading-none">{bpm}</span>
           </div>

           {/* Wheel Picker */}
           <div className="relative h-16 w-14 overflow-hidden bg-black rounded-lg border border-zinc-800 shadow-inner">
             {/* Gradient Overlays for depth effect */}
             <div className="absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
             <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
             
             {/* Center Indicator */}
             <div className="absolute top-1/2 left-0 right-0 h-8 -mt-4 border-y border-brass-500/50 bg-brass-500/10 pointer-events-none z-0" />

             <div 
               ref={scrollContainerRef}
               onScroll={handleScroll}
               className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[16px]" // Padding to center first/last items
             >
               {bpmOptions.map((val) => (
                 <div 
                   key={val} 
                   className={`h-[32px] flex items-center justify-center snap-center text-sm font-bold transition-colors ${val === bpm ? 'text-brass-400' : 'text-zinc-700'}`}
                 >
                   {val}
                 </div>
               ))}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};