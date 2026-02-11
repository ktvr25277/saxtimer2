import React, { useState, useEffect, useRef } from 'react';
import { TunerEngine, TunerResult } from '../services/tunerService';
import { InstrumentKey } from '../types';
import { AudioWaveform, Activity } from 'lucide-react';

const KATAKANA_NOTES = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"];

interface TunerWidgetProps {
  instrumentKey: InstrumentKey;
}

export const TunerWidget: React.FC<TunerWidgetProps> = ({ instrumentKey }) => {
  const [isOn, setIsOn] = useState(false);
  const [result, setResult] = useState<TunerResult>({ noteIndex: -1, cents: 0, frequency: 0, isActive: false });
  const engineRef = useRef<TunerEngine | null>(null);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  const toggleTuner = async () => {
    if (isOn) {
      if (engineRef.current) engineRef.current.stop();
      setIsOn(false);
    } else {
      if (!engineRef.current) {
        engineRef.current = new TunerEngine((res) => setResult(res));
      }
      try {
        await engineRef.current.start();
        setIsOn(true);
      } catch (e) {
        console.error("Failed to start tuner", e);
        alert("Microphone access is required for the tuner.");
      }
    }
  };

  // Visual Helper for Cents
  const getCentsColor = (cents: number) => {
    if (Math.abs(cents) < 10) return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]';
    if (Math.abs(cents) < 25) return 'text-brass-400';
    return 'text-red-400';
  };

  const getIndicatorPosition = (cents: number) => {
    // Map -50..50 to 0..100%
    const clamped = Math.max(-50, Math.min(50, cents));
    return 50 + clamped; // Simple percentage center is 50
  };

  const getNoteLabel = (index: number) => {
    if (index === -1) return '-';
    
    let offset = 0;
    
    // Transposition Logic
    // Index 0 = Concert C
    switch (instrumentKey) {
      case InstrumentKey.Bb:
        // Soprano/Tenor Sax (Bb): Written C sounds Bb (-2 semitones). 
        // Heard Concert C (0) -> Show D (2). Offset +2.
        offset = 2;
        break;
      case InstrumentKey.Eb:
        // Alto/Baritone Sax (Eb): Written C sounds Eb (-9 semitones / +3 semitones).
        // Heard Concert C (0) -> Show A (9). Offset +9.
        offset = 9;
        break;
      case InstrumentKey.C:
      default:
        offset = 0;
        break;
    }

    const transposedIndex = (index + offset) % 12;
    return KATAKANA_NOTES[transposedIndex];
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={toggleTuner}
        className={`
          flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
          ${isOn 
            ? 'bg-zinc-800 text-brass-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]' 
            : 'bg-zinc-900/50 text-zinc-500 hover:text-brass-400 hover:bg-zinc-800 border border-zinc-800'
          }
        `}
        aria-label="Toggle Tuner"
      >
        {isOn ? <Activity size={18} className="animate-pulse" /> : <AudioWaveform size={18} />}
      </button>

      {/* Pop-out Display */}
      <div className={`
        absolute top-full mt-2 right-0 
        flex flex-col items-center justify-center
        bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-xl p-3 shadow-2xl
        transition-all duration-300 origin-top-right
        ${isOn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 -translate-y-2 pointer-events-none'}
        min-w-[80px]
      `}>
         {/* Key Indicator */}
         <div className="absolute top-1 right-2 text-[8px] font-bold text-zinc-600 border border-zinc-700 rounded px-1">
            {instrumentKey}
         </div>

         {/* Note Name */}
         <div className={`text-3xl font-bold font-sans whitespace-nowrap mt-1 ${getCentsColor(result.cents)}`}>
            {getNoteLabel(result.noteIndex)}
         </div>
         
         {/* Cents Bar */}
         <div className="w-full h-1 bg-zinc-700 rounded-full mt-2 relative overflow-hidden">
            <div className="absolute top-0 bottom-0 w-0.5 bg-zinc-500 left-1/2 -ml-[1px]" /> {/* Center Mark */}
            <div 
              className={`absolute top-0 bottom-0 w-2 h-full rounded-full transition-all duration-100 ${Math.abs(result.cents) < 10 ? 'bg-emerald-400' : 'bg-brass-500'}`}
              style={{ 
                left: `${getIndicatorPosition(result.cents)}%`,
                opacity: result.noteIndex === -1 ? 0 : 1
              }} 
            />
         </div>
         
         <div className="text-[10px] text-zinc-500 mt-1 font-mono">
            {result.noteIndex !== -1 ? `${result.cents > 0 ? '+' : ''}${result.cents}¢` : 'Ready'}
         </div>
      </div>
    </div>
  );
};