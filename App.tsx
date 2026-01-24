import React, { useState, useEffect, useRef } from 'react';
import { TimerStatus, PracticeStats } from './types';
import { PRACTICE_DURATION, BREAK_DURATION } from './constants';
import { CircularTimer } from './components/CircularTimer';
import { Metronome } from './components/Metronome';
import { PracticeLog } from './components/PracticeLog';
import { AdviceWidget } from './components/AdviceWidget';
import { Music } from 'lucide-react';

const STORAGE_KEY = 'sax-pro-stats';

function App() {
  // Timer State
  const [status, setStatus] = useState<TimerStatus>(TimerStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState(PRACTICE_DURATION);
  
  // Stats State
  const [stats, setStats] = useState<PracticeStats>({
    todaySeconds: 0,
    totalSeconds: 0,
    lastPracticeDate: new Date().toISOString().split('T')[0]
  });

  const timerRef = useRef<number | null>(null);

  // Load stats on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: PracticeStats = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      
      // Reset daily stats if it's a new day
      if (parsed.lastPracticeDate !== today) {
        setStats({
          ...parsed,
          todaySeconds: 0,
          lastPracticeDate: today
        });
      } else {
        setStats(parsed);
      }
    }
  }, []);

  // Save stats on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  // Timer Logic
  useEffect(() => {
    if (status !== TimerStatus.IDLE) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleCycleComplete();
            return 0;
          }
          return prev - 1;
        });

        // Update stats only during practice
        if (status === TimerStatus.PRACTICE) {
          setStats(prev => ({
            ...prev,
            todaySeconds: prev.todaySeconds + 1,
            totalSeconds: prev.totalSeconds + 1
          }));
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleCycleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Play a gentle notification sound (optional, kept simple for now)
    
    if (status === TimerStatus.PRACTICE) {
      setStatus(TimerStatus.BREAK);
      setTimeLeft(BREAK_DURATION);
    } else if (status === TimerStatus.BREAK) {
      setStatus(TimerStatus.PRACTICE);
      setTimeLeft(PRACTICE_DURATION);
    }
  };

  const toggleTimer = () => {
    if (status === TimerStatus.IDLE) {
      setStatus(TimerStatus.PRACTICE);
    } else {
      setStatus(TimerStatus.IDLE);
      // Reset logic could go here if we want stop to mean 'reset'
      // For now, it's 'Pause'. To reset, maybe long press or separate button?
      // Keeping it simple: IDLE acts as Pause.
    }
  };

  const getProgress = () => {
    const total = status === TimerStatus.BREAK ? BREAK_DURATION : PRACTICE_DURATION;
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className="min-h-screen bg-piano text-zinc-100 flex flex-col items-center pb-safe-area-bottom pt-safe-area-top overflow-x-hidden">
      
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded bg-gradient-to-tr from-brass-600 to-brass-300 flex items-center justify-center shadow-lg shadow-brass-500/20">
              <Music size={18} className="text-black" />
           </div>
           <h1 className="text-xl font-serif font-bold tracking-wider text-brass-400">SAX PRO</h1>
        </div>
        <div className="text-xs text-zinc-600 font-mono border border-zinc-800 px-2 py-1 rounded">
          v1.0
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md px-6 flex flex-col gap-8 items-center">
        
        {/* Timer Section */}
        <div className="mt-4">
          <CircularTimer 
            progress={getProgress()} 
            timeLeft={timeLeft} 
            status={status}
            toggleTimer={toggleTimer}
          />
        </div>

        {/* Stats */}
        <PracticeLog 
          todaySeconds={stats.todaySeconds} 
          totalSeconds={stats.totalSeconds} 
        />

        {/* Metronome */}
        <div className="w-full">
           <Metronome />
        </div>

        {/* AI Advice */}
        <div className="w-full mb-8">
          <AdviceWidget totalSeconds={stats.totalSeconds} />
        </div>

      </main>

      {/* Aesthetic Background Gradients */}
      <div className="fixed top-[-20%] left-[-20%] w-[50%] h-[50%] bg-brass-900/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none z-0" />
    </div>
  );
}

export default App;