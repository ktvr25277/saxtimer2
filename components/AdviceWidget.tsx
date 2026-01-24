import React, { useEffect, useState } from 'react';
import { getPersonalizedAdvice } from '../services/geminiService';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AdviceWidgetProps {
  totalSeconds: number;
}

export const AdviceWidget: React.FC<AdviceWidgetProps> = ({ totalSeconds }) => {
  const [advice, setAdvice] = useState<string>("Loading professional advice...");
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const text = await getPersonalizedAdvice(totalSeconds);
      setAdvice(text);
    } catch (e) {
      setAdvice("Keep practicing. Your tone is your signature.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/50 rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-brass-500" />
        
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 text-brass-500">
            <Sparkles size={16} />
            <h3 className="text-xs font-serif uppercase tracking-widest font-bold">Pro Tip</h3>
          </div>
          <button 
            onClick={fetchAdvice} 
            disabled={loading}
            className="text-zinc-600 hover:text-brass-400 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <p className={`text-zinc-300 font-serif italic text-sm leading-relaxed transition-opacity duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          "{advice}"
        </p>

        {/* Decorative background element */}
        <div className="absolute -bottom-4 -right-4 text-zinc-800/20 pointer-events-none select-none">
             <Sparkles size={80} />
        </div>
    </div>
  );
};
