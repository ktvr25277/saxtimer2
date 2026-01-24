import React, { useState } from 'react';
import { Trophy, Activity, Edit2, X, Check } from 'lucide-react';

interface PracticeLogProps {
  todaySeconds: number;
  totalSeconds: number;
  onUpdateToday: (secs: number) => void;
  onUpdateTotal: (secs: number) => void;
}

export const PracticeLog: React.FC<PracticeLogProps> = ({ 
  todaySeconds, 
  totalSeconds,
  onUpdateToday,
  onUpdateTotal
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<'today' | 'total' | null>(null);
  const [tempHours, setTempHours] = useState(0);
  const [tempMinutes, setTempMinutes] = useState(0);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const openModal = (field: 'today' | 'total', currentSecs: number) => {
    setEditingField(field);
    setTempHours(Math.floor(currentSecs / 3600));
    setTempMinutes(Math.floor((currentSecs % 3600) / 60));
    setIsModalOpen(true);
  };

  const saveEdit = () => {
    const newSecs = (tempHours * 3600) + (tempMinutes * 60);
    if (editingField === 'today') {
      onUpdateToday(newSecs);
    } else if (editingField === 'total') {
      onUpdateTotal(newSecs);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Today Block */}
        <div 
          onClick={() => openModal('today', todaySeconds)}
          className="relative bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 flex items-center justify-between overflow-hidden transition-all cursor-pointer group"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-30" />
          
          <div className="flex items-center gap-2.5">
             <div className="p-1.5 rounded-md bg-zinc-800/50 text-zinc-400 border border-zinc-700/30">
               <Activity size={14} />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Today</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-sans font-medium text-zinc-100 tracking-tight">
              {formatTime(todaySeconds)}
            </span>
            <Edit2 size={10} className="text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Total Block */}
        <div 
          onClick={() => openModal('total', totalSeconds)}
          className="relative bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-3 flex items-center justify-between overflow-hidden group transition-all cursor-pointer"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brass-600/50 to-transparent opacity-50" />
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-brass-500/10 blur-xl rounded-full pointer-events-none" />

          <div className="flex items-center gap-2.5">
             <div className="p-1.5 rounded-md bg-brass-900/20 text-brass-500 border border-brass-500/20">
               <Trophy size={14} />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-brass-500/70 transition-colors">Total</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-sans font-medium text-brass-400 tracking-tight shadow-brass-500/10">
              {formatTime(totalSeconds)}
            </span>
            <Edit2 size={10} className="text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
          <div 
            className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl transform transition-all scale-100" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-serif font-bold text-zinc-200">
                Edit {editingField === 'today' ? 'Today' : 'Total'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-end justify-center gap-4 mb-8">
              <div className="flex flex-col items-center gap-2">
                <input 
                  type="number" 
                  value={tempHours}
                  onChange={(e) => setTempHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-3xl font-mono text-white focus:border-brass-500 focus:ring-1 focus:ring-brass-500/50 outline-none"
                />
                <span className="text-xs uppercase tracking-widest text-zinc-600 font-bold">Hours</span>
              </div>
              
              <div className="h-16 flex items-center pb-4">
                <span className="text-2xl text-zinc-700">:</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <input 
                  type="number" 
                  value={tempMinutes}
                  onChange={(e) => setTempMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-3xl font-mono text-white focus:border-brass-500 focus:ring-1 focus:ring-brass-500/50 outline-none"
                />
                <span className="text-xs uppercase tracking-widest text-zinc-600 font-bold">Mins</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit}
                className="flex-1 py-3 rounded-xl bg-brass-500 text-black font-bold hover:bg-brass-400 transition-colors shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};