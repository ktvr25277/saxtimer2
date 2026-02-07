import React from 'react';
import { Music, Clock, Sparkles, Mic, ArrowRight, Activity, Wind } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-piano text-zinc-100 overflow-x-hidden font-sans selection:bg-brass-500/30 relative">
      
      {/* --- Background Layer --- */}
      <div className="fixed inset-0 z-0">
        {/* Saxophone Image: High quality, moody close-up of brass keys */}
        <img 
          src="https://images.unsplash.com/photo-1598218967923-3882a17cb25e?q=80&w=2574&auto=format&fit=crop" 
          alt="Soprano Saxophone Atmosphere" 
          className="w-full h-full object-cover opacity-40 scale-105 animate-[pulse-slow_10s_ease-in-out_infinite]"
        />
        
        {/* Gradient Overlay: Ensures text is readable and adds the "Noir" feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/80 to-[#050505]" />
        
        {/* Gold Tint: Unifies the image with the brand color */}
        <div className="absolute inset-0 bg-brass-900/20 mix-blend-overlay" />
        
        {/* Abstract Light Leaks for "Stage" atmosphere */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-brass-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brass-900/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
      </div>

      {/* Header */}
      <nav className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-brass-500 to-brass-200 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]">
             <Music size={18} className="text-black" />
          </div>
          <span className="text-xl font-serif font-bold tracking-wider text-brass-100 drop-shadow-lg">SAX PRO</span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-16 pb-24 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
        
        <div className="flex-1 text-center md:text-left space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-brass-500/30 backdrop-blur-md text-[10px] uppercase tracking-widest text-brass-400 mb-4 animate-fade-in-up shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-brass-500 animate-pulse"></span>
            Professional Practice Assistant
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold leading-[1.1] tracking-tight text-white drop-shadow-xl">
            Refine Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brass-300 via-brass-500 to-brass-700">Signature Tone.</span>
          </h1>
          
          <p className="text-zinc-300 text-lg md:text-xl leading-relaxed max-w-lg mx-auto md:mx-0 font-light drop-shadow-md">
            Dedicated specifically for Soprano Saxophone players. Master your pitch, timing, and endurance with AI-driven insights.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 justify-center md:justify-start">
            <button 
              onClick={onStart}
              className="group relative px-8 py-4 rounded-full bg-brass-500 text-black font-bold text-sm uppercase tracking-widest hover:bg-brass-400 transition-all active:scale-95 shadow-[0_0_25px_rgba(234,179,8,0.4)] flex items-center gap-2 overflow-hidden ring-2 ring-brass-400/50 ring-offset-2 ring-offset-black"
            >
              <span className="relative z-10">Start Practice</span>
              <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
            <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
              v1.4 • Optimized for Mobile
            </span>
          </div>
        </div>

        {/* Hero Visual/Graphic */}
        <div className="flex-1 w-full max-w-md relative group cursor-pointer perspective-1000" onClick={onStart}>
           <div className="absolute inset-0 bg-brass-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
           
           {/* Glassmorphism Card */}
           <div className="relative aspect-square rounded-[3rem] bg-zinc-900/60 border border-white/10 shadow-2xl backdrop-blur-xl p-8 flex flex-col justify-between overflow-hidden transition-transform duration-500 hover:scale-[1.02] hover:-rotate-1">
              {/* Decorative Icon Background */}
              <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] pointer-events-none rotate-12">
                 <Wind size={280} className="text-white" />
              </div>
              
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <div className="text-5xl font-mono text-white tracking-tighter drop-shadow-md">10:00</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-brass-400 font-bold">Focus Phase</div>
                 </div>
                 <div className="p-3 rounded-full bg-black/40 border border-white/5">
                    <Activity className="text-emerald-500 animate-pulse" size={20} />
                 </div>
              </div>

              <div className="space-y-6">
                 {/* Visualizer Mockup */}
                 <div className="flex items-end justify-between h-12 gap-1 px-1">
                    {[40, 70, 50, 90, 60, 80, 40, 60, 30].map((h, i) => (
                      <div key={i} style={{ height: `${h}%` }} className="w-full bg-brass-500/80 rounded-t-sm" />
                    ))}
                 </div>

                 <div className="flex items-center gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
                    <Sparkles size={18} className="text-brass-400 shrink-0" />
                    <p className="text-xs text-zinc-200 italic font-serif leading-relaxed">
                      "Keep your embouchure firm but relaxed for high F#."
                    </p>
                 </div>
              </div>
           </div>
        </div>

      </main>

      {/* Features Grid */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <FeatureCard 
            icon={<Clock size={24} />}
            title="Cycle Timer"
            desc="Automated 10min practice / 5min break intervals."
          />
          <FeatureCard 
            icon={<Music size={24} />}
            title="Pro Metronome"
            desc="Drift-free engine with polyrhythm & tap tempo."
          />
          <FeatureCard 
            icon={<Mic size={24} />}
            title="Precision Tuner"
            desc="Chromatic tuner optimized for soprano range."
          />
          <FeatureCard 
            icon={<Sparkles size={24} />}
            title="AI Instructor"
            desc="Personalized advice based on session time."
          />

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-8 text-zinc-600 text-xs border-t border-white/5 bg-black/50 backdrop-blur-sm">
        <p>© 2024 SAX PRO. Designed for the dedicated.</p>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="p-6 rounded-2xl bg-zinc-950/60 border border-white/5 hover:border-brass-500/40 hover:bg-zinc-900/80 transition-all duration-300 group backdrop-blur-sm">
    <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-brass-400 group-hover:scale-110 transition-all mb-4 border border-zinc-800 group-hover:border-brass-500/20 shadow-lg">
      {icon}
    </div>
    <h3 className="text-lg font-serif font-bold text-zinc-100 mb-2 group-hover:text-brass-100 transition-colors">{title}</h3>
    <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
      {desc}
    </p>
  </div>
);