import React, { useState } from 'react';
import { Play, Sparkles, Filter, Clapperboard, Eye } from 'lucide-react';
import { ShowcaseItem } from '../types/video';
import { SHOWCASE_VIDEOS } from '../data/presets';

interface ShowcaseGalleryProps {
  onSelectVideo: (video: ShowcaseItem) => void;
  onUsePrompt: (prompt: string, style?: string, camera?: string) => void;
}

export const ShowcaseGallery: React.FC<ShowcaseGalleryProps> = ({
  onSelectVideo,
  onUsePrompt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredVideos = selectedCategory === 'all'
    ? SHOWCASE_VIDEOS
    : SHOWCASE_VIDEOS.filter(v => v.category === selectedCategory);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Muestras de Calidad Cinematográfica</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Descubre lo que puede crear Veo y Gemini Omni Flash
          </h2>
          <p className="mt-2 text-zinc-400 text-sm leading-relaxed">
            Explora videos cinematográficos reales creados con IA. Haz clic en cualquier video para reproducirlo con controles completos, examinar el prompt de dirección o cargarlo directamente en el estudio para generar tus propias variantes.
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mr-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span>Categoría:</span>
          </div>
          {[
            { id: 'all', label: 'Todos los Videos' },
            { id: 'cinematic', label: 'Cinemático' },
            { id: 'nature', label: 'Naturaleza & Fauna' },
            { id: 'scifi', label: 'Ciencia Ficción & Cyber' },
            { id: 'animation', label: 'Animación 3D' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="group relative bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col"
          >
            {/* Video preview container */}
            <div
              className="relative aspect-video bg-black cursor-pointer overflow-hidden"
              onClick={() => onSelectVideo(video)}
            >
              <img
                src={video.posterUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />

              {/* Badges overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-semibold text-rose-300 border border-white/10">
                  {video.style}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-semibold text-zinc-300 border border-white/10">
                  {video.duration} • {video.resolution}
                </span>
              </div>

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                <div className="w-14 h-14 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all">
                  <Play className="w-6 h-6 ml-1 fill-white" />
                </div>
              </div>

              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/80 backdrop-blur text-[11px] font-medium text-white flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ver y Probar</span>
              </div>
            </div>

            {/* Info and Prompt */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight mb-2 group-hover:text-rose-300 transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 font-sans">
                  "{video.prompt}"
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/80">
                <button
                  onClick={() => onSelectVideo(video)}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Reproducir</span>
                </button>
                <button
                  onClick={() => onUsePrompt(video.prompt, video.style, video.camera)}
                  className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 hover:from-rose-500/30 hover:to-amber-500/30 text-rose-300 text-xs font-medium border border-rose-500/30 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Usar Prompt</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
