import React from 'react';
import { Play, Trash2, Film, Sparkles, Download, Clock, Ratio } from 'lucide-react';
import { GeneratedVideo } from '../types/video';

interface VideoHistoryProps {
  videos: GeneratedVideo[];
  onSelectVideo: (video: GeneratedVideo) => void;
  onDeleteVideo: (id: string) => void;
  onClearAll: () => void;
  onNavigateToStudio: () => void;
}

export const VideoHistory: React.FC<VideoHistoryProps> = ({
  videos,
  onSelectVideo,
  onDeleteVideo,
  onClearAll,
  onNavigateToStudio,
}) => {
  if (videos.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
          <Film className="w-8 h-8 text-zinc-600" />
        </div>
        <h3 className="text-lg font-bold text-white">Aún no has generado videos en esta sesión</h3>
        <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          Tus videos generados con Veo (gemini-omni-1.2-flash) aparecerán aquí con sus especificaciones de duración, resolución y prompt completo.
        </p>
        <button
          onClick={onNavigateToStudio}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium text-xs transition-all shadow-lg shadow-rose-500/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generar Mi Primer Video</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Tus Videos Generados</h2>
          <p className="text-xs text-zinc-400">Total: {videos.length} videos en el historial local</p>
        </div>

        <button
          onClick={onClearAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/20 text-xs transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpiar Historial</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {videos.map((vid) => (
          <div
            key={vid.id}
            className="group relative bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all shadow-lg flex flex-col justify-between"
          >
            {/* Video preview container */}
            <div
              className="relative aspect-video bg-black cursor-pointer overflow-hidden flex items-center justify-center"
              onClick={() => onSelectVideo(vid)}
            >
              <video
                src={vid.url}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                muted
                playsInline
                preload="metadata"
              />

              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10">
                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-semibold text-rose-300 border border-white/10">
                  {vid.aspectRatio}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-semibold text-zinc-300 border border-white/10">
                  {vid.duration}
                </span>
              </div>

              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                <div className="w-12 h-12 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 ml-0.5 fill-white" />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-3">
                  "{vid.prompt}"
                </p>

                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>{new Date(vid.createdAt).toLocaleDateString()} {new Date(vid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80">
                <button
                  onClick={() => onSelectVideo(vid)}
                  className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 text-zinc-400" />
                  <span>Ver y Descargar</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteVideo(vid.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors"
                  title="Eliminar de mi historial"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
