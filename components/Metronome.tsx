import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MetronomeEngine } from '../services/audioService';
import { MIN_BPM, MAX_BPM } from '../constants';
import { Play, Square } from 'lucide-react';

interface MetronomeProps {
  className?: string;
}

export const Metronome: React.FC<MetronomeProps> = ({ className }) => {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number>(-1); // 0-3
  
  const engineRef = useRef<MetronomeEngine | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Audio Engine
  useEffect(() => {
    engineRef.current = new MetronomeEngine((beat) => {
      setActiveBeat(beat);
      // Auto clear active beat for visual blink effect
      setTimeout(() => setActiveBeat(-1), 150);
    });
    return () => {
      if (engineRef.current) engineRef.current.stop();
    };
  }, []);

  // Update Engine BPM
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setBpm(bpm);
    }
  }, [bpm]);

  const toggleMetronome = () => {
    if (!engineRef.current) return;
    
    if (isPlaying) {
      engineRef.current.stop();
      setIsPlaying(false);
      setActiveBeat(-1);
    } else {
      engineRef.current.start();
      setIsPlaying(true);
    }
  };

  // Generate BPM options for the wheel
  const bpmOptions = Array.from({ length: MAX_BPM - MIN_BPM + 1 }, (_, i) => MIN_BPM + i);

  // Handle Wheel Scroll
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, clientHeight } = scrollContainerRef.current;
      const itemHeight = 40; // Approx height of each BPM item
      const centerIndex = Math.round(scrollTop / itemHeight);
      const newBpm = MIN_BPM + centerIndex;
      
      if (newBpm >= MIN_BPM && newBpm <= MAX_BPM && newBpm !== bpm) {
         // We update state for visual highlighting, but debouncing might be needed for audio engine 
         // if this causes performance issues. For now, direct update is fine.
         setBpm(newBpm);
      }
    }
  };

  // Center the initial BPM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const itemHeight = 40;
      const targetScroll = (bpm - MIN_BPM) * itemHeight;
      scrollContainerRef.current.scrollTop = targetScroll;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Visual Beats */}
      <div className="flex gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`
              w-4 h-4 rounded-full transition-all duration-75 border border-zinc-700
              ${activeBeat === i 
                ? (i === 0 ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-brass-400 shadow-[0_0_10px_#facc15]') 
                : 'bg-zinc-900'}
            `}
          />
        ))}
      </div>

      <div className="flex items-center justify-between w-full max-w-xs bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
        
        {/* Play Button */}
        <button
          onClick={toggleMetronome}
          className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
            ${isPlaying 
              ? 'bg-zinc-800 text-brass-500 border border-brass-500/30' 
              : 'bg-brass-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:bg-brass-400'}
          `}
        >
          {isPlaying ? <Square size={24} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>

        {/* BPM Display & Wheel */}
        <div className="flex items-center gap-4">
           <div className="text-right">
             <span className="block text-xs text-zinc-500 font-serif tracking-widest">BPM</span>
             <span className="block text-3xl font-mono text-white">{bpm}</span>
           </div>

           {/* Wheel Picker */}
           <div className="relative h-24 w-16 overflow-hidden bg-black rounded-lg border border-zinc-800 shadow-inner">
             {/* Gradient Overlays for depth effect */}
             <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
             <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
             
             {/* Center Indicator */}
             <div className="absolute top-1/2 left-0 right-0 h-8 -mt-4 border-y border-brass-500/50 bg-brass-500/10 pointer-events-none z-0" />

             <div 
               ref={scrollContainerRef}
               onScroll={handleScroll}
               className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[32px]" // py is padding to allow top/bottom items to center
             >
               {bpmOptions.map((val) => (
                 <div 
                   key={val} 
                   className={`h-[40px] flex items-center justify-center snap-center text-sm font-bold transition-colors ${val === bpm ? 'text-brass-400' : 'text-zinc-700'}`}
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
