import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Download, Trash2, Play, Pause, Save, X, ListMusic, FileAudio } from 'lucide-react';
import { RecorderEngine } from '../services/recorderService';

interface Recording {
  id: number;
  url: string;
  blob: Blob;
  date: Date;
  duration?: string;
}

export const Recorder: React.FC = () => {
  // Recorder State
  const [isRecording, setIsRecording] = useState(false);
  
  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<{blob: Blob, url: string} | null>(null);
  const [isPlayingReview, setIsPlayingReview] = useState(false);
  
  // Library State
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);

  // Refs
  const recorderRef = useRef<RecorderEngine>(new RecorderEngine());
  const reviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const libraryAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup all URLs on unmount
  useEffect(() => {
    return () => {
      if (currentRecording) URL.revokeObjectURL(currentRecording.url);
      recordings.forEach(rec => URL.revokeObjectURL(rec.url));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- ACTIONS ---

  const handleToggleRecord = async () => {
    if (isRecording) {
      try {
        const blob = await recorderRef.current.stop();
        const url = URL.createObjectURL(blob);
        setCurrentRecording({ blob, url });
        setIsRecording(false);
        setShowReviewModal(true);
      } catch (e) {
        console.error("Failed to stop recording", e);
        setIsRecording(false);
      }
    } else {
      try {
        await recorderRef.current.start();
        setIsRecording(true);
      } catch (e) {
        alert("Microphone access is required to record.");
        console.error(e);
      }
    }
  };

  const handleSaveToLibrary = () => {
    if (!currentRecording) return;
    
    const newRec: Recording = {
      id: Date.now(),
      url: currentRecording.url,
      blob: currentRecording.blob,
      date: new Date()
    };
    
    setRecordings(prev => [newRec, ...prev]);
    setShowReviewModal(false);
    setCurrentRecording(null); // Clear current ref, ownership moved to list
  };

  const handleDiscard = () => {
    if (currentRecording) {
      URL.revokeObjectURL(currentRecording.url);
    }
    setCurrentRecording(null);
    setShowReviewModal(false);
  };

  // --- LIBRARY ACTIONS ---

  const handleDelete = (id: number) => {
    setRecordings(prev => {
      const target = prev.find(r => r.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter(r => r.id !== id);
    });
    if (playingId === id) setPlayingId(null);
  };

  const handleDownload = (rec: Recording) => {
    const a = document.createElement('a');
    a.href = rec.url;
    const ext = rec.blob.type.includes('mp4') ? 'mp4' : 'webm';
    a.download = `sax-practice-${rec.date.toISOString().slice(0, 19).replace(/:/g, '-')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleLibraryPlay = (rec: Recording) => {
    if (!libraryAudioRef.current) return;

    if (playingId === rec.id) {
      libraryAudioRef.current.pause();
      setPlayingId(null);
    } else {
      libraryAudioRef.current.src = rec.url;
      libraryAudioRef.current.play().catch(e => console.error("Play error:", e));
      setPlayingId(rec.id);
    }
  };

  // --- RENDER ---

  return (
    <div className="flex flex-col gap-5 mt-4">
      
      {/* 1. Record Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleToggleRecord}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full border transition-all active:scale-95 shadow-lg
            ${isRecording 
              ? 'bg-red-500/20 text-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' 
              : 'bg-zinc-900/50 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 border-zinc-800'}
          `}
          title={isRecording ? "録音停止" : "録音開始"}
        >
          {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
        </button>
        <span className={`text-[8px] whitespace-nowrap font-bold tracking-tighter ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`}>
          {isRecording ? '録音中...' : '録音'}
        </span>
      </div>

      {/* 2. Library Button */}
      <div className="flex flex-col items-center gap-1">
         <button
           onClick={() => setShowLibrary(true)}
           className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900/50 text-zinc-500 hover:text-brass-400 hover:bg-zinc-800 border border-zinc-800 transition-all active:scale-95 shadow-lg"
           title="ライブラリ"
         >
           <ListMusic size={16} />
         </button>
         <span className="text-[8px] text-zinc-600 whitespace-nowrap font-bold tracking-tighter">再生</span>
      </div>

      {/* --- REVIEW MODAL --- */}
      {showReviewModal && currentRecording && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <span className="text-zinc-200 text-sm font-bold">New Recording</span>
            </div>

            <audio 
              ref={reviewAudioRef} 
              src={currentRecording.url} 
              onEnded={() => setIsPlayingReview(false)} 
              onPause={() => setIsPlayingReview(false)}
            />

            <div className="flex justify-center py-4">
              <button 
                onClick={() => {
                   if (reviewAudioRef.current) {
                      if (isPlayingReview) { reviewAudioRef.current.pause(); } 
                      else { reviewAudioRef.current.play(); setIsPlayingReview(true); }
                   }
                }}
                className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center hover:bg-zinc-700 hover:text-brass-400 shadow-lg"
              >
                 {isPlayingReview ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleDiscard} className="flex-1 py-2.5 rounded-xl bg-zinc-950 text-zinc-500 hover:text-red-400 text-xs font-bold uppercase">Discard</button>
              <button onClick={handleSaveToLibrary} className="flex-1 py-2.5 rounded-xl bg-brass-500 text-black hover:bg-brass-400 text-xs font-bold uppercase shadow-lg shadow-brass-500/20">Keep</button>
            </div>
          </div>
        </div>
      )}

      {/* --- LIBRARY MODAL --- */}
      {showLibrary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowLibrary(false)}>
           <div className="w-full max-w-sm h-[60vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              
              <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
                 <div className="flex items-center gap-2 text-brass-400">
                    <ListMusic size={18} />
                    <span className="font-serif font-bold">Recordings</span>
                 </div>
                 <button onClick={() => setShowLibrary(false)} className="text-zinc-500 hover:text-zinc-300">
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 {recordings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                       <FileAudio size={32} className="opacity-20" />
                       <span className="text-xs">No recordings yet</span>
                    </div>
                 ) : (
                    recordings.map((rec) => (
                       <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/50 hover:bg-zinc-800/80 transition-colors">
                          <div className="flex items-center gap-3">
                             <button 
                               onClick={() => toggleLibraryPlay(rec)}
                               className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${playingId === rec.id ? 'bg-brass-500 text-black' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
                             >
                                {playingId === rec.id ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                             </button>
                             <div className="flex flex-col">
                                <span className="text-xs text-zinc-200 font-mono">
                                   {rec.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                   {rec.date.toLocaleDateString()}
                                </span>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                             <button onClick={() => handleDownload(rec)} className="p-2 text-zinc-500 hover:text-brass-400 transition-colors">
                                <Download size={14} />
                             </button>
                             <button onClick={() => handleDelete(rec.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
              
              {/* Hidden Shared Audio Player for Library */}
              <audio 
                 ref={libraryAudioRef} 
                 onEnded={() => setPlayingId(null)}
                 onPause={() => setPlayingId(null)}
              />
           </div>
        </div>
      )}

    </div>
  );
};