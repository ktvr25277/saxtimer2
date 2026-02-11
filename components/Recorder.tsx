import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mic, Square, Download, Trash2, Play, Pause, X, ListMusic, FileAudio, Waves, Box, Warehouse } from 'lucide-react';
import { RecorderEngine } from '../services/recorderService';
import { ReverbEngine, ReverbMode } from '../services/audioService';

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

  // Audio Effects State
  const [reverbMode, setReverbMode] = useState<ReverbMode>('none');

  // Refs
  const recorderRef = useRef<RecorderEngine>(new RecorderEngine());
  const reverbEngineRef = useRef<ReverbEngine>(new ReverbEngine());
  const reviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const libraryAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup all URLs on unmount
  useEffect(() => {
    return () => {
      if (currentRecording) URL.revokeObjectURL(currentRecording.url);
      recordings.forEach(rec => URL.revokeObjectURL(rec.url));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Audio Context Hookup for Reverb
  useEffect(() => {
    // Determine which audio element is active
    const activeAudio = showReviewModal ? reviewAudioRef.current : (showLibrary ? libraryAudioRef.current : null);
    
    if (activeAudio) {
      // Connect engine to the active element
      // We wrap in a timeout to ensure DOM is ready and prevents rapid mounting issues
      const timer = setTimeout(() => {
         try {
           // We only connect once we have a valid element. 
           // ReverbEngine handles duplicate connection checks internally or we rely on new instance if components remounted completely.
           // Since modals are conditional, refs are fresh.
           reverbEngineRef.current.connect(activeAudio);
           reverbEngineRef.current.setMode(reverbMode);
         } catch(e) {
           console.warn("Audio Context connect issue:", e);
         }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showReviewModal, showLibrary, currentRecording, playingId]);

  // Update Reverb Mode when changed
  useEffect(() => {
    reverbEngineRef.current.setMode(reverbMode);
  }, [reverbMode]);

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

  const toggleReviewPlay = () => {
    if (reviewAudioRef.current) {
      if (isPlayingReview) {
        reviewAudioRef.current.pause();
      } else {
        reviewAudioRef.current.play();
        setIsPlayingReview(true);
      }
    }
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

  // UI Component for Reverb Selector
  const ReverbSelector = () => (
    <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
      <button
        onClick={() => setReverbMode('none')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md transition-all text-[10px] uppercase font-bold tracking-wider ${reverbMode === 'none' ? 'bg-zinc-800 text-zinc-200 shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
      >
        <Waves size={12} /> Dry
      </button>
      <button
        onClick={() => setReverbMode('room')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md transition-all text-[10px] uppercase font-bold tracking-wider ${reverbMode === 'room' ? 'bg-zinc-800 text-brass-400 shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
      >
        <Box size={12} /> Room
      </button>
      <button
        onClick={() => setReverbMode('hall')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md transition-all text-[10px] uppercase font-bold tracking-wider ${reverbMode === 'hall' ? 'bg-zinc-800 text-brass-400 shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
      >
        <Warehouse size={12} /> Hall
      </button>
    </div>
  );

  // --- RENDER ---

  // Use Portal to render modals outside the parent stacking context
  const renderModals = () => {
    if (typeof document === 'undefined') return null;

    return createPortal(
      <>
        {/* --- REVIEW MODAL --- */}
        {showReviewModal && currentRecording && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <span className="text-zinc-200 text-sm font-bold tracking-wide">Review</span>
              </div>

              {/* Audio Element */}
              <audio 
                ref={reviewAudioRef} 
                src={currentRecording.url} 
                onEnded={() => setIsPlayingReview(false)} 
                onPause={() => setIsPlayingReview(false)}
                crossOrigin="anonymous" 
              />
              
              <div className="flex flex-col gap-6">
                 {/* Reverb Controls */}
                 <div className="space-y-2">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest pl-1">Acoustics</span>
                    <ReverbSelector />
                 </div>

                 {/* Play Control */}
                 <div className="flex justify-center">
                   <button 
                     onClick={toggleReviewPlay}
                     className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center hover:bg-zinc-700 hover:text-brass-400 hover:scale-105 transition-all shadow-lg"
                   >
                      {isPlayingReview ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                   </button>
                 </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleDiscard} 
                  className="flex-1 py-3 rounded-xl bg-zinc-950 text-zinc-500 hover:text-red-400 text-xs font-bold uppercase tracking-wider transition-colors border border-transparent hover:border-red-500/20"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSaveToLibrary} 
                  className="flex-1 py-3 rounded-xl bg-brass-500 text-black hover:bg-brass-400 text-xs font-bold uppercase tracking-wider shadow-lg shadow-brass-500/20 transition-all active:scale-95"
                >
                  Keep
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- LIBRARY MODAL --- */}
        {showLibrary && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowLibrary(false)}>
             <div 
               className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200" 
               style={{ height: '70vh' }}
               onClick={e => e.stopPropagation()}
             >
                
                <div className="flex justify-between items-center p-5 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur shrink-0">
                   <div className="flex items-center gap-2 text-brass-400">
                      <ListMusic size={20} />
                      <span className="font-serif font-bold tracking-wide">Library</span>
                   </div>
                   <button onClick={() => setShowLibrary(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/50 text-zinc-500 hover:text-white transition-colors">
                      <X size={18} />
                   </button>
                </div>

                {/* Library Reverb Controls */}
                <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/50">
                    <ReverbSelector />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                   {recordings.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-3">
                         <div className="p-4 rounded-full bg-zinc-800/50">
                            <FileAudio size={32} className="opacity-40" />
                         </div>
                         <span className="text-xs font-medium">No recordings yet</span>
                      </div>
                   ) : (
                      recordings.map((rec) => (
                         <div key={rec.id} className="group flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                               <button 
                                 onClick={() => toggleLibraryPlay(rec)}
                                 className={`
                                    w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all shadow-sm
                                    ${playingId === rec.id 
                                       ? 'bg-brass-500 text-black scale-105' 
                                       : 'bg-zinc-700 text-zinc-400 group-hover:bg-zinc-600 group-hover:text-zinc-200'}
                                 `}
                               >
                                  {playingId === rec.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                               </button>
                               <div className="flex flex-col min-w-0">
                                  <span className="text-xs text-zinc-200 font-bold truncate">
                                     {rec.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-mono">
                                     {rec.date.toLocaleDateString()}
                                  </span>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                               <button onClick={() => handleDownload(rec)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-700 hover:text-brass-400 transition-colors" title="Download">
                                  <Download size={16} />
                               </button>
                               <button onClick={() => handleDelete(rec.id)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-700 hover:text-red-400 transition-colors" title="Delete">
                                  <Trash2 size={16} />
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
                   crossOrigin="anonymous"
                />
             </div>
          </div>
        )}
      </>,
      document.body
    );
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        
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

      </div>

      {renderModals()}
    </>
  );
};