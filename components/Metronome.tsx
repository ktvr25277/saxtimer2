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
      const itemHeight = 32; 
      const centerIndex = Math.round(scrollTop / itemHeight);
      const newBpm = MIN_BPM + centerIndex;
      
      if (newBpm >= MIN_BPM && newBpm <= MAX_BPM && newBpm !== bpm) {
         setBpm(newBpm);
      }
    }
  };

  // Sync Scroll Wheel Position when BPM prop changes (e.g. via preset or initial load)
  useEffect(() => {
    if (scrollContainerRef.current) {
      const itemHeight = 32;
      const targetScroll = (bpm - MIN_BPM) * itemHeight;
      
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
    <div className={`flex flex-col items-center w-full ${className}`}>
      
      <div className="flex items-center justify-between w-full max-w-xs mb-2">
        {/* Visual Beats */}
        <div className="flex gap-4">
          {Array.from({ length: beatsPerBar }).map((_, i) => (
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

        {/* Time Signature Selector */}
        <div className="flex gap-1">
          {[2, 3, 4].map(b => (
            <button
              key={b}
              onClick={() => setBeatsPerBar(b)}
              className={`
                w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all
                ${beatsPerBar === b 
                  ? 'bg-brass-500 text-black shadow-[0_0_8px_rgba(234,179,8,0.4)]' 
                  : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}
              `}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-xs bg-zinc-900/50 rounded-2xl p-3 border border-zinc-800">
        
        {/* Play Button */}
        <button
          onClick={onToggle}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shrink-0
            ${isPlaying 
              ? 'bg-zinc-800 text-brass-500 border border-brass-500/30' 
              : 'bg-brass-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:bg-brass-400'}
          `}
        >
          {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>

        {/* Separator line */}
        <div className="h-10 w-[1px] bg-zinc-800 shrink-0 mx-2" />

        {/* Controls Group */}
        <div className="flex items-center gap-3">
          
          {/* BPM Display & Wheel */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="block text-[8px] text-zinc-500 font-serif tracking-widest uppercase">BPM</span>
              <span className="block text-2xl font-mono text-white leading-none">{bpm}</span>
            </div>

            {/* Wheel Picker */}
            <div className="relative h-16 w-12 overflow-hidden bg-black rounded-lg border border-zinc-800 shadow-inner">
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

          {/* Presets Column (Right Side) */}
          <div className="flex flex-col gap-1.5 shrink-0">
             {presets.map((presetBpm, i) => (
               <button
                  key={i}
                  onClick={() => setBpm(presetBpm)}
                  className={`
                    w-8 py-1 rounded text-[10px] font-mono font-medium transition-all text-center
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