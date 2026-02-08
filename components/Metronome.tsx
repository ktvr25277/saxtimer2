import React, { useEffect, useRef, useState } from 'react';
import { MetronomeEngine } from '../services/audioService';
import { MIN_BPM, MAX_BPM } from '../constants';
import { Play, Square } from 'lucide-react';

interface MetronomeProps {
  className?: string;
  engine: MetronomeEngine | null;
  isPlaying: boolean;
  onToggle: () => void;
  bpm: number;
  setBpm: (bpm: number) => void;
  presets: [number, number, number];
}

export const Metronome: React.FC<MetronomeProps> = ({ 
  className,
  engine,
  isPlaying,
  onToggle,
  bpm,
  setBpm,
  presets
}) => {
  const [beatsPerBar, setBeatsPerBar] = useState(4); // Default to 4 beats
  const [activeBeat, setActiveBeat] = useState<number>(-1); 
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInternalScroll = useRef(false);
  const ITEM_HEIGHT = 20; // Compact item height for the wheel

  // Connect UI beat visualizer to Engine
  useEffect(() => {
    if (engine) {
      engine.setOnBeat((beat) => {
        setActiveBeat(beat);
        // Auto clear active beat for visual blink effect
        setTimeout(() => setActiveBeat(-1), 150);
      });
      // Sync initial config
      engine.setBpm(bpm);
      engine.setBeatsPerBar(beatsPerBar);
    }
  }, [engine]); 

  // Update Engine BPM when prop changes
  useEffect(() => {
    if (engine) {
      engine.setBpm(bpm);
    }
  }, [bpm, engine]);

  // Update Engine Beats Per Bar
  useEffect(() => {
    if (engine) {
      engine.setBeatsPerBar(beatsPerBar);
    }
  }, [beatsPerBar, engine]);

  // Generate BPM options for the wheel
  const bpmOptions = Array.from({ length: MAX_BPM - MIN_BPM + 1 }, (_, i) => MIN_BPM + i);

  // Handle Wheel Scroll
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      // If we are scrolling programmatically, ignore this event
      if (isInternalScroll.current) return;

      const { scrollTop } = scrollContainerRef.current;
      const centerIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const newBpm = MIN_BPM + centerIndex;
      
      if (newBpm >= MIN_BPM && newBpm <= MAX_BPM && newBpm !== bpm) {
         setBpm(newBpm);
      }
    }
  };

  // Sync Scroll Wheel Position when BPM prop changes (e.g. via preset or initial load)
  useEffect(() => {
    if (scrollContainerRef.current) {
      const targetScroll = (bpm - MIN_BPM) * ITEM_HEIGHT;
      
      // Check if we need to scroll (avoid loops)
      if (Math.abs(scrollContainerRef.current.scrollTop - targetScroll) > 10) {
        isInternalScroll.current = true;
        scrollContainerRef.current.scrollTop = targetScroll;
        // Release lock after a short delay
        setTimeout(() => { isInternalScroll.current = false; }, 100);
      }
    }
  }, [bpm]);

  return (
    <div className={`w-full max-w-[340px] mx-auto ${className}`}>
      {/* Unified Compact Card - Reduced Padding */}
      <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800/80 shadow-lg py-2 px-3">
        
        {/* Top Row: Visuals & Settings - Reduced Bottom Margin */}
        <div className="flex items-center justify-between mb-1.5 px-1">
          {/* Visual Beats */}
          <div className="flex gap-2 items-center h-3">
            {Array.from({ length: beatsPerBar }).map((_, i) => (
              <div
                key={i}
                className={`
                  rounded-full transition-all duration-75 border border-zinc-700/50
                  ${activeBeat === i 
                    ? (i === 0 ? 'w-3 h-3 bg-red-500 shadow-[0_0_10px_#ef4444]' : 'w-2.5 h-2.5 bg-brass-400 shadow-[0_0_8px_#facc15]') 
                    : 'w-2 h-2 bg-zinc-800'}
                `}
              />
            ))}
          </div>

          {/* Time Signature Selector - Compact */}
          <div className="flex gap-0.5 bg-zinc-900/80 p-0.5 rounded-md border border-zinc-800">
            {[2, 3, 4].map(b => (
              <button
                key={b}
                onClick={() => setBeatsPerBar(b)}
                className={`
                  w-6 h-4 rounded-[3px] flex items-center justify-center text-[9px] font-bold transition-all
                  ${beatsPerBar === b 
                    ? 'bg-brass-500 text-black shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}
                `}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Row: Main Controls */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Play Button - Smaller Size (w-10 h-10) */}
          <button
            onClick={onToggle}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0
              ${isPlaying 
                ? 'bg-zinc-800 text-brass-500 border border-brass-500/30' 
                : 'bg-brass-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.25)] hover:bg-brass-400 active:scale-95'}
            `}
          >
            {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-zinc-800" />

          {/* BPM Controls Group */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            
            <div className="text-right min-w-[3rem]">
              <span className="block text-[7px] text-zinc-600 font-serif tracking-widest uppercase leading-none mb-0.5">BPM</span>
              <span className="block text-xl font-mono text-white leading-none font-medium tracking-tighter">{bpm}</span>
            </div>

            {/* Wheel Picker - Compact Width/Height */}
            <div className="relative h-10 w-16 overflow-hidden bg-black/40 rounded-md border border-zinc-800/50 shadow-inner">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
              <div className="absolute top-1/2 left-0 right-0 h-5 -mt-2.5 border-y border-brass-500/30 bg-brass-500/5 pointer-events-none z-0" />

              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[10px]"
              >
                {bpmOptions.map((val) => (
                  <div 
                    key={val} 
                    className={`h-[20px] flex items-center justify-center snap-center text-xs font-bold transition-colors ${val === bpm ? 'text-brass-400 scale-110' : 'text-zinc-700'}`}
                  >
                    {val}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Presets - Horizontal Row */}
          <div className="flex flex-row gap-1">
             {presets.map((presetBpm, i) => (
               <button
                  key={i}
                  onClick={() => setBpm(presetBpm)}
                  className={`
                    w-8 h-8 rounded-lg text-[10px] font-mono font-medium transition-all text-center flex items-center justify-center
                    ${bpm === presetBpm 
                       ? 'bg-brass-500/20 text-brass-400 border border-brass-500/30' 
                       : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-transparent'}
                  `}
               >
                  {presetBpm}
               </button>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
};