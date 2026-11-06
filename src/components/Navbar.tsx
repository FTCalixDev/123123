import React from 'react';
import { Video, Sparkles, BookOpen, Film, Clapperboard } from 'lucide-react';

interface NavbarProps {
  currentTab: 'studio' | 'showcase' | 'history' | 'guide';
  setCurrentTab: (tab: 'studio' | 'showcase' | 'history' | 'guide') => void;
  hasApiKey: boolean;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  hasApiKey,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-[1.5px] shadow-lg shadow-rose-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Veo Studio</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Gemini Omni
              </span>
            </div>
            <p className="text-xs text-zinc-400">Generación y dirección de video con IA</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/70 p-1 rounded-xl border border-zinc-800/80">
          <button
            onClick={() => setCurrentTab('studio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'studio'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span>Crear Video</span>
          </button>

          <button
            onClick={() => setCurrentTab('showcase')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'showcase'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>Galería de Muestras</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'history'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mis Videos</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'guide'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guía & Capacidades</span>
          </button>
        </nav>

        {/* Status / Model pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-zinc-300 font-mono text-[11px]">gemini-omni-1.2-flash</span>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-zinc-900 bg-zinc-950 px-2 py-2 gap-1 overflow-x-auto">
        <button
          onClick={() => setCurrentTab('studio')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium ${
            currentTab === 'studio' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-rose-400" />
          <span>Crear</span>
        </button>
        <button
          onClick={() => setCurrentTab('showcase')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium ${
            currentTab === 'showcase' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-amber-400" />
          <span>Muestras</span>
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium ${
            currentTab === 'history' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Videos ({historyCount})</span>
        </button>
        <button
          onClick={() => setCurrentTab('guide')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium ${
            currentTab === 'guide' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span>Guía</span>
        </button>
      </div>
    </header>
  );
};
