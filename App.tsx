import React, { useState, useEffect, useRef } from 'react';
import { TimerStatus, PracticeStats, AlarmType, InstrumentKey, MetronomeSoundType } from './types';
import { PRACTICE_DURATION, BREAK_DURATION, MIN_BPM, MAX_BPM } from './constants';
import { CircularTimer } from './components/CircularTimer';
import { Metronome } from './components/Metronome';
import { PracticeLog } from './components/PracticeLog';
import { AdviceWidget } from './components/AdviceWidget';
import { TunerWidget } from './components/TunerWidget';
import { AlarmEngine, MetronomeEngine } from './services/audioService';
import { Music, Settings, Volume2, Pause, Play, StopCircle, BatteryCharging, Clock, RefreshCcw, Save } from 'lucide-react';

const STORAGE_KEY = 'sax-pro-stats';
const SETTINGS_KEY = 'sax-pro-settings';

interface BPMSettings {
  default: number;
  presets: [number, number, number];
}

function App() {
  // --- STATE ---
  const [status, setStatus] = useState<TimerStatus>(TimerStatus.IDLE);
  
  // Settings State (Seconds)
  const [practiceDuration, setPracticeDuration] = useState(PRACTICE_DURATION);
  const [breakDuration, setBreakDuration] = useState(BREAK_DURATION);
  
  const [timeLeft, setTimeLeft] = useState(PRACTICE_DURATION);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  
  // BPM State
  const [currentBpm, setCurrentBpm] = useState(60);
  const [bpmSettings, setBpmSettings] = useState<BPMSettings>({
    default: 60,
    presets: [60, 90, 120]
  });
  
  // Settings UI
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmType>(AlarmType.DIGITAL);
  const [metronomeSound, setMetronomeSound] = useState<MetronomeSoundType>(MetronomeSoundType.DIGITAL);
  const [wakeLockEnabled, setWakeLockEnabled] = useState(true);
  const [instrumentKey, setInstrumentKey] = useState<InstrumentKey>(InstrumentKey.Bb);

  // Stats
  const [stats, setStats] = useState<PracticeStats>({
    todaySeconds: 0,
    totalSeconds: 0,
    lastPracticeDate: new Date().toISOString().split('T')[0]
  });

  // Refs
  const timerRef = useRef<number | null>(null);
  const alarmEngine = useRef<AlarmEngine | null>(null);
  const metronomeEngine = useRef<MetronomeEngine>(new MetronomeEngine());
  const wakeLockSentinel = useRef<WakeLockSentinel | null>(null);

  // --- LIFECYCLE & HELPERS ---

  useEffect(() => {
    // Init Audio Engine
    alarmEngine.current = new AlarmEngine();
    
    // Load persisted data
    const savedStats = localStorage.getItem(STORAGE_KEY);
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        const today = new Date().toISOString().split('T')[0];
        
        const safeTotal = Number(parsed.totalSeconds) || 0;
        const safeToday = Number(parsed.todaySeconds) || 0;
        
        if (parsed.lastPracticeDate !== today) {
          setStats({
            todaySeconds: 0,
            totalSeconds: safeTotal,
            lastPracticeDate: today
          });
        } else {
          setStats({
            todaySeconds: safeToday,
            totalSeconds: safeTotal,
            lastPracticeDate: today
          });
        }
      } catch (e) {
        console.error("Failed to parse saved stats:", e);
      }
    }

    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const { alarm, wakeLock, practice, break: breakTime, bpm, key, metronomeSound: savedMetaSound } = JSON.parse(savedSettings);
        if (alarm) setSelectedAlarm(alarm);
        if (typeof wakeLock === 'boolean') setWakeLockEnabled(wakeLock);
        if (typeof practice === 'number') setPracticeDuration(practice);
        if (typeof breakTime === 'number') setBreakDuration(breakTime);
        if (key) setInstrumentKey(key);
        if (savedMetaSound) setMetronomeSound(savedMetaSound);
        
        if (bpm) {
          setBpmSettings(bpm);
          setCurrentBpm(bpm.default); // Apply default on load
        }
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ 
      alarm: selectedAlarm, 
      wakeLock: wakeLockEnabled,
      practice: practiceDuration,
      break: breakDuration,
      bpm: bpmSettings,
      key: instrumentKey,
      metronomeSound: metronomeSound
    }));
  }, [selectedAlarm, wakeLockEnabled, practiceDuration, breakDuration, bpmSettings, instrumentKey, metronomeSound]);

  // Sync Metronome Sound Settings
  useEffect(() => {
    if (metronomeEngine.current) {
      metronomeEngine.current.setSoundType(metronomeSound);
    }
  }, [metronomeSound]);

  // If settings change while IDLE, update display immediately
  useEffect(() => {
    if (status === TimerStatus.IDLE) {
      setTimeLeft(practiceDuration);
    }
  }, [practiceDuration, status]);

  // Handle Visibility Change (Wake Lock & Audio Resume)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      
      // 1. Audio Resume Logic
      if (isVisible) {
        // Attempt to resume audio contexts when coming back to foreground
        metronomeEngine.current?.resumeContext();
        alarmEngine.current?.resumeContext();
      }

      // 2. Wake Lock Logic
      if (isVisible && wakeLockEnabled && status !== TimerStatus.IDLE) {
        requestWakeLock();
      }
    };

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && wakeLockEnabled) {
        try {
          wakeLockSentinel.current = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.log('Wake Lock request failed:', err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockSentinel.current) {
        await wakeLockSentinel.current.release();
        wakeLockSentinel.current = null;
      }
    };

    if (wakeLockEnabled && status !== TimerStatus.IDLE && !isPaused) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLockEnabled, status, isPaused]);


  // --- TIMER LOGIC ---

  useEffect(() => {
    if (status === TimerStatus.IDLE || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      
      // PRACTICE COUNTDOWN
      if (status === TimerStatus.PRACTICE) {
        if (timeLeft > 0) {
          setTimeLeft(t => t - 1);
          setStats(s => ({ ...s, todaySeconds: s.todaySeconds + 1, totalSeconds: s.totalSeconds + 1 }));
        } else {
          // Time is up -> Trigger Overtime
          triggerAlarm();
          setStatus(TimerStatus.PRACTICE_OVERTIME);
          setOvertimeSeconds(0);
        }
      } 
      // BREAK COUNTDOWN
      else if (status === TimerStatus.BREAK) {
        if (timeLeft > 0) {
          setTimeLeft(t => t - 1);
        } else {
          // Break is up -> Trigger Overtime
          triggerAlarm();
          setStatus(TimerStatus.BREAK_OVERTIME);
          setOvertimeSeconds(0);
        }
      }
      // OVERTIME COUNTING (Both Practice and Break)
      else if (status === TimerStatus.PRACTICE_OVERTIME || status === TimerStatus.BREAK_OVERTIME) {
        setOvertimeSeconds(s => s + 1);
        // We also count practice overtime towards total stats
        if (status === TimerStatus.PRACTICE_OVERTIME) {
          setStats(s => ({ ...s, todaySeconds: s.todaySeconds + 1, totalSeconds: s.totalSeconds + 1 }));
        }
      }

    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft, isPaused]);

  // --- ACTIONS ---

  const triggerAlarm = () => {
    // Stop Metronome if playing so alarm is heard
    if (metronomeEngine.current) {
      metronomeEngine.current.stop();
      setIsMetronomePlaying(false);
    }

    if (alarmEngine.current) {
      alarmEngine.current.play(selectedAlarm, true); // Loop alarm
    }
  };

  const stopAlarm = () => {
    if (alarmEngine.current) {
      alarmEngine.current.stop();
    }
  };

  const handleMainAction = () => {
    stopAlarm(); // Stop alarm if playing

    // iOS fix: Prepare audio engine on user interaction
    if (alarmEngine.current) {
      alarmEngine.current.prepare();
    }
    // Also ensure metronome context is healthy
    if (metronomeEngine.current) {
       metronomeEngine.current.prepare();
    }

    if (isPaused) {
      setIsPaused(false);
      return;
    }

    switch (status) {
      case TimerStatus.IDLE:
        setStatus(TimerStatus.PRACTICE);
        setTimeLeft(practiceDuration);
        break;
      case TimerStatus.PRACTICE:
        setStatus(TimerStatus.BREAK);
        setTimeLeft(breakDuration);
        break;
      case TimerStatus.PRACTICE_OVERTIME:
        setStatus(TimerStatus.BREAK);
        setTimeLeft(breakDuration);
        setOvertimeSeconds(0);
        break;
      case TimerStatus.BREAK:
        setStatus(TimerStatus.PRACTICE);
        setTimeLeft(practiceDuration);
        break;
      case TimerStatus.BREAK_OVERTIME:
        setStatus(TimerStatus.PRACTICE);
        setTimeLeft(practiceDuration);
        setOvertimeSeconds(0);
        break;
    }
  };

  const handleSoundReset = () => {
    // FORCE HARD RESET of Audio Contexts
    // This destroys the old stuck context and creates a brand new one immediately
    if (metronomeEngine.current) {
        metronomeEngine.current.hardReset();
    }
    if (alarmEngine.current) {
        alarmEngine.current.hardReset();
    }
    // If metronome was playing, it will stop. User needs to restart it manually, which is safer.
    setIsMetronomePlaying(false);
  };

  const handlePause = () => {
    stopAlarm();
    // Also stop metronome when pausing timer
    if (metronomeEngine.current) {
      metronomeEngine.current.stop();
      setIsMetronomePlaying(false);
    }
    setIsPaused(true);
  };

  const handleStop = () => {
    stopAlarm();
    // Also stop metronome when stopping session
    if (metronomeEngine.current) {
      metronomeEngine.current.stop();
      setIsMetronomePlaying(false);
    }
    setIsPaused(false);
    setStatus(TimerStatus.IDLE);
    setTimeLeft(practiceDuration);
    setOvertimeSeconds(0);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    // Stop test sound if playing
    stopAlarm(); 
    // Prepare alarm on settings open too, just in case user is testing
    if (alarmEngine.current) {
      alarmEngine.current.prepare();
    }
  };

  const testAlarm = (type: AlarmType) => {
    stopAlarm();
    if (alarmEngine.current) alarmEngine.current.play(type, false);
  };
  
  const handleMetronomeToggle = () => {
    if (!metronomeEngine.current) return;
    
    // Ensure context is ready before toggling
    metronomeEngine.current.prepare();

    if (isMetronomePlaying) {
      metronomeEngine.current.stop();
      setIsMetronomePlaying(false);
    } else {
      metronomeEngine.current.start();
      setIsMetronomePlaying(true);
    }
  };

  const getProgress = () => {
    if (status === TimerStatus.PRACTICE_OVERTIME || status === TimerStatus.BREAK_OVERTIME) return 100;
    const total = (status === TimerStatus.BREAK) ? breakDuration : practiceDuration;
    return ((total - timeLeft) / total) * 100;
  };

  // Helper to determine the main button color based on "Next State"
  const getMainButtonColor = () => {
    if (isPaused) return 'bg-brass-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:bg-brass-400';
    
    // If practicing, next is BREAK (Green)
    if (status === TimerStatus.PRACTICE || status === TimerStatus.PRACTICE_OVERTIME) {
      return 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-emerald-400';
    }
    
    // If idle or break, next is PRACTICE (Yellow/Brass)
    return 'bg-brass-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:bg-brass-400';
  };

  // Stats Editing Handlers
  const handleUpdateToday = (newSeconds: number) => {
    const diff = newSeconds - stats.todaySeconds;
    setStats(s => ({
      ...s,
      todaySeconds: newSeconds,
      totalSeconds: Math.max(0, s.totalSeconds + diff) // Keep them in sync
    }));
  };

  const handleUpdateTotal = (newSeconds: number) => {
    setStats(s => ({
      ...s,
      totalSeconds: newSeconds
    }));
  };

  return (
    <div className="min-h-screen bg-piano text-zinc-100 flex flex-col items-center overflow-x-hidden relative">
      
      {/* Top Background Gradient */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-brass-900/10 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <header className="w-full px-6 pt-safe pb-4 flex justify-between items-center z-10 bg-gradient-to-b from-black to-transparent">
        <div className="flex items-center gap-2 mt-4"> {/* Added mt-4 for extra notch clearance */}
           <div className="w-8 h-8 rounded bg-gradient-to-tr from-brass-600 to-brass-300 flex items-center justify-center shadow-lg shadow-brass-500/20">
              <Music size={18} className="text-black" />
           </div>
           <h1 className="text-xl font-serif font-bold tracking-wider text-brass-400">SAX PRO</h1>
        </div>
        <button onClick={toggleSettings} className="p-2 text-zinc-500 hover:text-brass-400 mt-4">
          <Settings size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md px-6 flex flex-col gap-4 items-center z-0 pb-32"> {/* Added padding bottom for fixed footer */}
        
        {/* Timer Area with Tuner */}
        <div className="mt-2 relative w-full flex justify-center">
          
          {/* Sound Reset: Positioned to the left of the timer */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1">
             <button
               onClick={handleSoundReset}
               className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900/50 text-zinc-500 hover:text-brass-400 hover:bg-zinc-800 border border-zinc-800 transition-all active:scale-95 shadow-lg"
               title="音が出ない場合はタップ"
             >
               <RefreshCcw size={16} />
             </button>
             <span className="text-[8px] text-zinc-600 whitespace-nowrap font-bold tracking-tighter">音リセット</span>
          </div>

          <CircularTimer 
            progress={getProgress()} 
            timeLeft={timeLeft} 
            overtimeSeconds={overtimeSeconds}
            status={status}
            mainAction={handleMainAction}
            isPaused={isPaused}
          />
          {/* Tuner Widget: Positioned to the right of the timer, vertically centered */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
             <TunerWidget instrumentKey={instrumentKey} />
          </div>
        </div>

        {/* Stats */}
        <PracticeLog 
          todaySeconds={stats.todaySeconds} 
          totalSeconds={stats.totalSeconds} 
          onUpdateToday={handleUpdateToday}
          onUpdateTotal={handleUpdateTotal}
        />

        {/* Metronome */}
        <div className="w-full">
           <Metronome 
             engine={metronomeEngine.current}
             isPlaying={isMetronomePlaying}
             onToggle={handleMetronomeToggle}
             bpm={currentBpm}
             setBpm={setCurrentBpm}
             presets={bpmSettings.presets}
           />
        </div>

        {/* AI Advice */}
        <div className="w-full">
          <AdviceWidget totalSeconds={stats.totalSeconds} />
        </div>
      </main>

      {/* Fixed Footer Controls */}
      <div className="fixed bottom-0 left-0 w-full pb-safe pt-4 px-6 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 z-20 flex justify-center gap-8 items-center h-24">
         
         {/* STOP/RESET */}
         <button 
           onClick={handleStop}
           disabled={status === TimerStatus.IDLE}
           className={`flex flex-col items-center gap-1 transition-colors ${status === TimerStatus.IDLE ? 'text-zinc-700' : 'text-zinc-400 hover:text-red-400'}`}
         >
           <StopCircle size={32} />
           <span className="text-[10px] uppercase tracking-widest font-bold">完全終了</span>
         </button>

         {/* MAIN ACTION (Context Aware) */}
         <button 
            onClick={handleMainAction}
            className={`w-16 h-16 rounded-full text-black flex items-center justify-center active:scale-95 transition-all ${getMainButtonColor()}`}
         >
            {isPaused ? <Play size={28} className="ml-1" /> : (
              (status === TimerStatus.IDLE) ? <Play size={28} className="ml-1" /> :
              (status === TimerStatus.PRACTICE || status === TimerStatus.PRACTICE_OVERTIME) ? 
                <span className="text-[10px] font-bold tracking-tighter">休憩開始</span> :
              (status === TimerStatus.BREAK || status === TimerStatus.BREAK_OVERTIME) ? 
                <span className="text-[10px] font-bold tracking-tighter">練習再開</span> :
              <Play size={28} className="ml-1" />
            )}
         </button>

         {/* PAUSE */}
         <button 
           onClick={handlePause}
           disabled={status === TimerStatus.IDLE || isPaused}
           className={`flex flex-col items-center gap-1 transition-colors ${status === TimerStatus.IDLE || isPaused ? 'text-zinc-700' : 'text-zinc-400 hover:text-brass-400'}`}
         >
           <Pause size={32} />
           <span className="text-[10px] uppercase tracking-widest font-bold">一時停止</span>
         </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={toggleSettings}>
          <div className="w-full max-w-sm max-h-[85vh] overflow-y-auto bg-zinc-900 border-t sm:border border-zinc-800 p-6 rounded-t-3xl sm:rounded-2xl shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center sticky top-0 bg-zinc-900 pb-2 z-10 border-b border-zinc-800/50">
              <h2 className="text-xl font-serif text-brass-400">Settings</h2>
              <button onClick={toggleSettings} className="text-zinc-500">Close</button>
            </div>

            {/* Instrument Key Settings */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Instrument Key</label>
              <div className="flex gap-2 bg-zinc-800/50 p-1.5 rounded-lg border border-zinc-700/50">
                 {[InstrumentKey.Eb, InstrumentKey.Bb, InstrumentKey.C].map((key) => (
                    <button
                       key={key}
                       onClick={() => setInstrumentKey(key)}
                       className={`
                         flex-1 py-2 rounded-md text-sm font-bold transition-all
                         ${instrumentKey === key 
                            ? 'bg-zinc-700 text-brass-400 shadow-sm border border-zinc-600' 
                            : 'text-zinc-500 hover:text-zinc-300'}
                       `}
                    >
                       {key}
                       <span className="block text-[8px] font-normal opacity-70">
                         {key === InstrumentKey.Eb ? 'Alto/Bari' : key === InstrumentKey.Bb ? 'Sop/Ten' : 'Concert'}
                       </span>
                    </button>
                 ))}
              </div>
            </div>

            {/* Timer Settings */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Durations (Minutes)</label>
              <div className="space-y-3">
                
                {/* Practice Duration */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-brass-500/20 text-brass-400">
                      <Clock size={18} />
                    </div>
                    <span className="text-zinc-200 text-sm">Practice</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="1"
                      max="120"
                      value={Math.floor(practiceDuration / 60)}
                      onChange={(e) => {
                         const val = parseInt(e.target.value) || 1;
                         setPracticeDuration(val * 60);
                      }}
                      className="w-16 bg-zinc-900 border border-zinc-700 rounded-md text-center py-1 text-white font-mono focus:border-brass-500 outline-none"
                    />
                  </div>
                </div>

                {/* Break Duration */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                      <Clock size={18} />
                    </div>
                    <span className="text-zinc-200 text-sm">Break</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <input 
                      type="number" 
                      min="1"
                      max="60"
                      value={Math.floor(breakDuration / 60)}
                      onChange={(e) => {
                         const val = parseInt(e.target.value) || 1;
                         setBreakDuration(val * 60);
                      }}
                      className="w-16 bg-zinc-900 border border-zinc-700 rounded-md text-center py-1 text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Metronome Settings */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Metronome</label>
              <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 space-y-4">
                 {/* Default BPM */}
                 <div className="flex items-center justify-between">
                    <span className="text-zinc-300 text-sm">Startup BPM</span>
                    <input 
                      type="number" 
                      min={MIN_BPM}
                      max={MAX_BPM}
                      value={bpmSettings.default}
                      onChange={(e) => {
                         const val = Math.max(MIN_BPM, Math.min(MAX_BPM, parseInt(e.target.value) || 60));
                         setBpmSettings(s => ({ ...s, default: val }));
                      }}
                      className="w-16 bg-zinc-900 border border-zinc-700 rounded-md text-center py-1 text-white font-mono focus:border-brass-500 outline-none"
                    />
                 </div>
                 
                 {/* Presets */}
                 <div>
                    <span className="text-zinc-500 text-xs uppercase tracking-wide block mb-2">Presets</span>
                    <div className="flex gap-2">
                       {bpmSettings.presets.map((preset, index) => (
                         <div key={index} className="flex-1 flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-600 text-center">#{index + 1}</span>
                            <input 
                              type="number" 
                              min={MIN_BPM}
                              max={MAX_BPM}
                              value={preset}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 // Allow partial typing, but if blur we'd clamp (needs complex handling for full robustness)
                                 // For now, simple clamp on change if > max to prevent crazy values, 
                                 // but allow < min to type "1" then "10"
                                 if (!isNaN(val)) {
                                    const newPresets = [...bpmSettings.presets] as [number, number, number];
                                    if (val > MAX_BPM) newPresets[index] = MAX_BPM;
                                    else newPresets[index] = val; // Allow numbers below MIN_BPM during typing
                                    setBpmSettings(s => ({ ...s, presets: newPresets }));
                                 }
                              }}
                              onBlur={(e) => {
                                 const val = parseInt(e.target.value) || 60;
                                 const clamped = Math.max(MIN_BPM, Math.min(MAX_BPM, val));
                                 const newPresets = [...bpmSettings.presets] as [number, number, number];
                                 newPresets[index] = clamped;
                                 setBpmSettings(s => ({ ...s, presets: newPresets }));
                              }}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-md text-center py-1 text-white font-mono text-sm focus:border-brass-500 outline-none"
                            />
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Metronome Sound Type */}
                 <div>
                    <span className="text-zinc-500 text-xs uppercase tracking-wide block mb-2">Sound Type</span>
                    <div className="flex gap-2">
                      {[MetronomeSoundType.DIGITAL, MetronomeSoundType.CLICK, MetronomeSoundType.WOOD].map((type) => (
                        <button
                          key={type}
                          onClick={() => setMetronomeSound(type)}
                          className={`
                            flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all
                            ${metronomeSound === type 
                               ? 'bg-zinc-700 text-brass-400 border border-zinc-600 shadow-sm' 
                               : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'}
                          `}
                        >
                          {type === MetronomeSoundType.DIGITAL ? 'Beep' : type === MetronomeSoundType.CLICK ? 'Click' : 'Wood'}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
            </div>

            {/* Alarm Settings */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Alarm Sound</label>
              <div className="space-y-2">
                {[AlarmType.DIGITAL, AlarmType.GONG, AlarmType.CHORD].map(type => (
                  <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="alarm" 
                        checked={selectedAlarm === type} 
                        onChange={() => setSelectedAlarm(type)}
                        className="accent-brass-500 w-4 h-4"
                      />
                      <span className="text-zinc-200 capitalize text-sm">{type.toLowerCase()}</span>
                    </div>
                    <button onClick={() => testAlarm(type)} className="text-zinc-500 hover:text-brass-400">
                      <Volume2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Wake Lock Settings */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Power</label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                 <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${wakeLockEnabled ? 'bg-brass-500/20 text-brass-400' : 'bg-zinc-700/50 text-zinc-500'}`}>
                     <BatteryCharging size={18} />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-zinc-200 text-sm">Prevent Sleep</span>
                     <span className="text-[10px] text-zinc-500">Keep screen on during practice</span>
                   </div>
                 </div>
                 <button 
                   onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
                   className={`w-12 h-6 rounded-full transition-colors relative ${wakeLockEnabled ? 'bg-brass-500' : 'bg-zinc-700'}`}
                 >
                   <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${wakeLockEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-zinc-600">
               SAX PRO v1.5
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;